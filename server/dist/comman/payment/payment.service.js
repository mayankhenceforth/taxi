"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stripe_1 = require("stripe");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const ride_schema_1 = require("../schema/ride.schema");
const invoice_service_1 = require("../invoice/invoice.service");
const cloudinary_service_1 = require("../cloudinary/cloudinary.service");
let PaymentService = class PaymentService {
    configService;
    rideModel;
    invoiceService;
    cloudinaryService;
    stripe;
    constructor(configService, rideModel, invoiceService, cloudinaryService) {
        this.configService = configService;
        this.rideModel = rideModel;
        this.invoiceService = invoiceService;
        this.cloudinaryService = cloudinaryService;
        this.stripe = new stripe_1.default(this.configService.get('STRIPE_SECRET_KEY'), {});
    }
    async createCheckoutSession(successUrl, cancelUrl, totalAmount, rideId) {
        const amountInCents = Math.round(totalAmount);
        const session = await this.stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'inr',
                        unit_amount: amountInCents,
                        product_data: { name: 'Ride Payment' },
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: { rideId },
        });
        await this.rideModel.findByIdAndUpdate(rideId, {
            checkoutSessionId: session.id,
        });
        return session.url;
        return session.url;
    }
    async handleWebhook(rawBody, sig) {
        try {
            const event = this.stripe.webhooks.constructEvent(rawBody, sig, this.configService.get('STRIPE_WEBHOOK_ENDPOINT_SECRET'));
            switch (event.type) {
                case 'checkout.session.completed': {
                    const session = event.data.object;
                    const fullSession = await this.stripe.checkout.sessions.retrieve(session.id, {
                        expand: ['payment_intent'],
                    });
                    const rideId = fullSession.metadata?.rideId;
                    const paymentIntent = fullSession.payment_intent;
                    if (rideId && paymentIntent) {
                        await this.rideModel.findByIdAndUpdate(rideId, {
                            paymentStatus: 'paid',
                            paymentIntentId: paymentIntent.id,
                        });
                        const pdfBuffer = await this.invoiceService.generateInvoice(rideId);
                        const uploadResult = await this.cloudinaryService.uploadFile({
                            buffer: pdfBuffer,
                            originalname: `invoice_${rideId}.pdf`,
                            mimetype: 'application/pdf',
                        });
                        await this.rideModel.findByIdAndUpdate(rideId, {
                            invoiceUrl: uploadResult.secure_url,
                        });
                    }
                    break;
                }
            }
            return { received: true };
        }
        catch (error) {
            console.error('Webhook error:', error.message);
            throw new common_1.BadRequestException(`Webhook error: ${error.message}`);
        }
    }
    async handleRefund(paymentIntentId, rideId) {
        const ride = await this.rideModel.findById(rideId);
        if (!ride) {
            throw new common_1.HttpException('Ride not found', common_1.HttpStatus.NOT_FOUND);
        }
        if (!paymentIntentId) {
            throw new common_1.BadRequestException('Payment intent ID is required for refund');
        }
        if (ride.status === 'started' || ride.status === 'completed') {
            console.log("Ride has started or completed, refund not allowed");
            throw new common_1.BadRequestException('Refund not allowed once ride has started or completed');
        }
        let refundAmount = 0;
        let refundPercentage = 0;
        let refundReason = '';
        const now = new Date();
        const createdAt = new Date(ride.createdAt);
        const diffMinutes = Math.floor((now.getTime() - createdAt.getTime()) / 60000);
        if (ride.cancelledBy === 'Driver') {
            refundAmount = ride.TotalFare;
            refundPercentage = 100;
            refundReason = 'Cancelled by Driver';
        }
        else if (ride.cancelledBy === 'User') {
            if (diffMinutes <= 10) {
                refundPercentage = 85;
                refundReason = 'Cancelled by User within 10 min';
            }
            else if (diffMinutes <= 15) {
                refundPercentage = 80;
                refundReason = 'Cancelled by User within 15 min';
            }
            else if (diffMinutes <= 20) {
                refundPercentage = 75;
                refundReason = 'Cancelled by User within 20 min';
            }
            else {
                refundPercentage = 0;
                refundReason = 'Cancelled by User after 20 min (No Refund)';
            }
            refundAmount = (ride.TotalFare * refundPercentage) / 100;
        }
        if (refundAmount <= 0) {
            throw new common_1.BadRequestException('No refund applicable for this ride');
        }
        console.log("Full refund applicable as ride was cancelled by Driver");
        console.log("Refund Amount:", refundAmount);
        console.log("Refund Percentage:", refundPercentage);
        console.log("Refund Reason:", refundReason);
        const refund = await this.stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: Math.round(refundAmount * 100),
        });
        ride.paymentStatus = refundPercentage === 100 ? 'refunded' : 'partially_refunded';
        ride.refundStatus = 'processed';
        ride.refundAmount = refundAmount;
        ride.refundPercentage = refundPercentage;
        ride.refundReason = refundReason;
        ride.refundedAt = new Date();
        await ride.save();
        return {
            message: 'Refund initiated successfully!',
            refundId: refund.id,
            status: refund.status,
            refundedAmount: refundAmount,
            refundPercentage,
        };
    }
    async createCustomer(email, paymentMethodId) {
        const customer = await this.stripe.customers.create({
            email,
            payment_method: paymentMethodId,
            invoice_settings: { default_payment_method: paymentMethodId },
        });
        return {
            success: true,
            message: 'Customer created successfully',
            data: { id: customer.id, email: customer.email },
        };
    }
    async createSubscription(customerId, priceId) {
        const subscription = await this.stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
        });
        return {
            success: true,
            message: 'Subscription created successfully',
            data: {
                subscriptionId: subscription.id,
                status: subscription.status,
                plan: subscription.items.data[0].price.nickname,
                price: subscription.items.data[0].price.unit_amount / 100,
                currency: subscription.items.data[0].price.currency,
            },
        };
    }
    async createSubscriptionWithCheckout(priceId, customerId, successUrl, cancelUrl) {
        const session = await this.stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            submit_type: 'subscribe',
            success_url: successUrl,
            cancel_url: cancelUrl,
        });
        return {
            success: true,
            message: 'Subscription checkout created successfully',
            data: { url: session.url, id: session.id },
        };
    }
    async handleUpdateSubscriptionStatus(subscriptionId, priceId) {
        const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
        const subscriptionItemId = subscription.items.data[0].id;
        const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
            items: [{ id: subscriptionItemId, price: priceId }],
            proration_behavior: 'create_prorations',
        });
        return {
            success: true,
            message: 'Subscription updated successfully',
            data: {
                subscriptionId: updatedSubscription.id,
                status: updatedSubscription.status,
                plan: updatedSubscription.items.data[0].price.nickname,
                price: updatedSubscription.items.data[0].price.unit_amount / 100,
                currency: updatedSubscription.items.data[0].price.currency,
            },
        };
    }
    async handleDeleteSubscription(subscriptionId) {
        const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
        return {
            success: true,
            message: 'Subscription canceled successfully',
            data: {
                subscriptionId: subscription.id,
                status: subscription.status,
                plan: subscription.items.data[0].price.nickname,
                price: subscription.items.data[0].price.unit_amount / 100,
                currency: subscription.items.data[0].price.currency,
            },
        };
    }
    async getUserSubscriptions(customerId) {
        const subscriptions = await this.stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
            expand: ['data.default_payment_method', 'data.items.data.price'],
        });
        const data = subscriptions.data.map(sub => ({
            id: sub.id,
            status: sub.status,
            currentPeriodStart: new Date(sub.items.data[0]?.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.items.data[0]?.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            priceId: sub.items.data[0].price.id,
            amount: sub.items.data[0].price.unit_amount / 100,
            currency: sub.items.data[0].price.currency,
            productId: sub.items.data[0].price.product,
            latestInvoiceId: sub.latest_invoice,
        }));
        return { success: true, message: 'User subscriptions fetched', data };
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(ride_schema_1.Ride.name)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        mongoose_2.Model,
        invoice_service_1.InvoiceService,
        cloudinary_service_1.CloudinaryService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map