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
const payment_schema_1 = require("../schema/payment.schema");
const driver_earnings_schema_1 = require("../schema/driver-earnings.schema");
const payout_schema_1 = require("../schema/payout.schema");
const DriverPaymentInfo_schema_1 = require("../schema/DriverPaymentInfo.schema");
let PaymentService = class PaymentService {
    configService;
    rideModel;
    paymentModel;
    driverPayoutModel;
    driverEarningModel;
    driverPaymentModel;
    invoiceService;
    cloudinaryService;
    stripe;
    constructor(configService, rideModel, paymentModel, driverPayoutModel, driverEarningModel, driverPaymentModel, invoiceService, cloudinaryService) {
        this.configService = configService;
        this.rideModel = rideModel;
        this.paymentModel = paymentModel;
        this.driverPayoutModel = driverPayoutModel;
        this.driverEarningModel = driverEarningModel;
        this.driverPaymentModel = driverPaymentModel;
        this.invoiceService = invoiceService;
        this.cloudinaryService = cloudinaryService;
        this.stripe = new stripe_1.default(this.configService.get('STRIPE_SECRET_KEY'), {});
    }
    async createCheckoutSession(successUrl, cancelUrl, totalAmount, rideId) {
        if (!rideId)
            throw new common_1.BadRequestException('rideId is required');
        if (totalAmount <= 0)
            throw new common_1.BadRequestException('totalAmount must be > 0');
        const amountInCents = Math.round(Number(totalAmount) * 100);
        const ride = await this.rideModel
            .findById(rideId)
            .populate('bookedBy driver')
            .lean();
        if (!ride)
            throw new common_1.HttpException('Ride not found', common_1.HttpStatus.NOT_FOUND);
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
        const payment = await this.paymentModel.create({
            userId: ride.bookedBy?._id ?? ride.bookedBy,
            driverId: ride.driver?._id ?? ride.driver,
            rideId: new mongoose_2.Types.ObjectId(rideId),
            amount: Number(totalAmount),
            currency: 'INR',
            status: 'unpaid',
            checkoutSessionId: session.id,
            paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
        });
        await this.rideModel.findByIdAndUpdate(rideId, {
            checkoutSessionId: session.id,
            paymentId: payment._id,
            paymentStatus: 'pending',
        });
        return session.url;
    }
    async handleWebhook(rawBody, sig) {
        let event;
        try {
            event = this.stripe.webhooks.constructEvent(rawBody, sig, this.configService.get('STRIPE_WEBHOOK_ENDPOINT_SECRET'));
        }
        catch (err) {
            console.error('Webhook signature verification failed:', err?.message);
            throw new common_1.BadRequestException(`Webhook error: ${err?.message}`);
        }
        try {
            switch (event.type) {
                case 'checkout.session.completed': {
                    const session = event.data.object;
                    const fullSession = await this.stripe.checkout.sessions.retrieve(session.id, {
                        expand: ['payment_intent'],
                    });
                    const rideId = fullSession.metadata?.rideId;
                    const paymentIntent = fullSession.payment_intent;
                    if (!rideId)
                        break;
                    const ride = await this.rideModel.findById(rideId);
                    if (!ride)
                        break;
                    const payment = await this.paymentModel.findOne({
                        $or: [
                            { _id: ride.paymentId },
                            { checkoutSessionId: session.id },
                        ],
                    });
                    if (payment) {
                        payment.status = 'paid';
                        if (paymentIntent?.id)
                            payment.paymentIntentId = paymentIntent.id;
                        await payment.save();
                    }
                    ride.paymentStatus = 'paid';
                    ride.paidAt = new Date();
                    await ride.save();
                    const pdfBuffer = await this.invoiceService.generateInvoice(rideId);
                    const uploadResult = (await this.cloudinaryService.uploadFile({
                        buffer: pdfBuffer,
                        originalname: `invoice_${ride._id}.pdf`,
                        mimetype: 'application/pdf',
                    }));
                    await this.rideModel.findByIdAndUpdate(ride._id, {
                        invoiceUrl: uploadResult?.secure_url,
                    });
                    break;
                }
                case 'payment_intent.succeeded': {
                    const pi = event.data.object;
                    await this.paymentModel.updateOne({ paymentIntentId: pi.id }, { status: 'succeeded' });
                    break;
                }
                case 'payment_intent.payment_failed': {
                    const pi = event.data.object;
                    await this.paymentModel.updateOne({ paymentIntentId: pi.id }, { status: 'failed' });
                    await this.rideModel.updateOne({ paymentId: { $exists: true } }, { $set: { paymentStatus: 'unpaid' } });
                    break;
                }
                default:
                    break;
            }
            return { received: true };
        }
        catch (error) {
            console.error('Webhook handling error:', error?.message);
            throw new common_1.BadRequestException(`Webhook error: ${error?.message}`);
        }
    }
    async handleRefund(rideId) {
        const ride = await this.rideModel.findById(rideId);
        if (!ride)
            throw new common_1.HttpException('Ride not found', common_1.HttpStatus.NOT_FOUND);
        if (!ride.paymentId) {
            throw new common_1.BadRequestException('Payment intent ID is required for refund');
        }
        if (ride.status === 'started' || ride.status === 'completed') {
            throw new common_1.BadRequestException('Refund not allowed once ride has started or completed');
        }
        if (ride.paymentStatus === 'refunded' || ride.paymentStatus === 'partially_refunded') {
            throw new common_1.BadRequestException('Refund already processed for this ride');
        }
        const paymentInfo = await this.paymentModel.findById(ride.paymentId);
        if (!paymentInfo || !paymentInfo.paymentIntentId) {
            throw new common_1.BadRequestException('Payment information not found for this ride');
        }
        let refundAmount = 0;
        let refundPercentage = 0;
        let refundReason = '';
        let driverEarningPercentage = 0;
        let driverEarningAmount = 0;
        let plateformEarning = 0;
        const now = new Date();
        const createdAt = new Date(ride.createdAt);
        const diffMinutes = Math.floor((now.getTime() - createdAt.getTime()) / 60000);
        if (ride.cancelledBy === 'Driver') {
            if (ride.status == "arrived") {
                refundPercentage = 80;
                driverEarningPercentage = 15;
                refundReason = 'Driver Arrived the location and cencelled';
                let platformEarningsPerscentage = 100 - refundPercentage - driverEarningPercentage;
                plateformEarning = (Number(ride.TotalFare) * platformEarningsPerscentage) / 100;
                refundAmount = (Number(ride.TotalFare) * refundPercentage) / 100;
                driverEarningAmount = (Number(ride.TotalFare) * driverEarningPercentage) / 100;
            }
            else {
                refundAmount = Number(ride.TotalFare);
                refundPercentage = 100;
                driverEarningPercentage = 0;
                refundReason = 'Cancelled by Driver';
            }
        }
        else if (ride.cancelledBy === 'User') {
            if (diffMinutes <= 10) {
                refundPercentage = 85;
                driverEarningPercentage = 10;
                refundReason = 'Cancelled by User within 10 min';
            }
            else if (diffMinutes <= 15) {
                refundPercentage = 80;
                driverEarningPercentage = 15;
                refundReason = 'Cancelled by User within 15 min';
            }
            else if (diffMinutes <= 20) {
                refundPercentage = 75;
                driverEarningPercentage = 20;
                refundReason = 'Cancelled by User within 20 min';
            }
            else {
                driverEarningPercentage = 40;
                refundPercentage = 50;
                refundReason = 'Cancelled by User after 20 min';
            }
            let platformEarningsPerscentage = 100 - refundPercentage - driverEarningPercentage;
            plateformEarning = (Number(ride.TotalFare) * platformEarningsPerscentage) / 100;
            refundAmount = (Number(ride.TotalFare) * refundPercentage) / 100;
            driverEarningAmount = (Number(ride.TotalFare) * driverEarningPercentage) / 100;
        }
        else {
            refundPercentage = 100;
            refundAmount = Number(ride.TotalFare);
            refundReason = 'Cancelled by System';
        }
        if (refundAmount <= 0) {
            paymentInfo.refundStatus = 'not_applicable';
            await paymentInfo.save();
            throw new common_1.BadRequestException('No refund applicable for this ride');
        }
        const refund = await this.stripe.refunds.create({
            payment_intent: paymentInfo.paymentIntentId,
            amount: Math.round(refundAmount * 100),
        });
        ride.paymentStatus = refundPercentage === 100 ? 'refunded' : 'partially_refunded';
        ride.refundedAt = new Date();
        await ride.save();
        paymentInfo.refundAmount = refundAmount;
        paymentInfo.refundPercentage = refundPercentage;
        paymentInfo.refundReason = refundReason;
        paymentInfo.refundStatus = 'processed';
        paymentInfo.refundId = refund.id;
        paymentInfo.status = ride.paymentStatus;
        await paymentInfo.save();
        return {
            message: 'Refund initiated successfully!',
            refundId: refund.id,
            status: refund.status,
            refundedAmount: refundAmount,
            refundPercentage,
            driverEarningAmount,
            driverEarningPercentage,
            plateformEarning
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
    async payoutDrivers() {
        const driverAggregates = await this.rideModel.aggregate([
            {
                $match: {
                    status: { $in: ["completed", "cancelled"] },
                    driverPaymentStatus: { $ne: "paid" }
                }
            },
            {
                $group: {
                    _id: "$driver",
                    totalEarnings: { $sum: "$driverEarnings" },
                    rides: {
                        $push: {
                            rideId: "$_id",
                            status: "$status",
                            driverEarnings: "$driverEarnings",
                            cancelledBy: "$cancelledBy"
                        }
                    }
                }
            }
        ]);
        const results = [];
        for (const driver of driverAggregates) {
            if (!driver._id)
                continue;
            const payoutDetails = await this.driverPayoutModel.findOne({
                driverId: driver._id,
                isActive: true,
                isDefault: true
            });
            if (!payoutDetails) {
                results.push({
                    driverId: driver._id,
                    message: "No payout details found, skipped",
                    totalEarnings: driver.balance
                });
                continue;
            }
            await this.driverEarningModel.updateMany({ driverId: driver._id, driverPaymentStatus: "unpaid" }, { $set: { driverPaymentStatus: "paid", updatedAt: new Date() } });
            await this.rideModel.updateMany({ _id: { $in: driver.rides.map((r) => r.rideId) } }, { $set: { driverPaymentStatus: "paid" } });
            const driverPayment = await this.driverPaymentModel.findOneAndUpdate({ driverId: driver._id }, {
                $set: {
                    payoutMethod: payoutDetails._id,
                    balance: 0,
                    status: "paid",
                    lastPayoutAmount: driver.totalEarnings,
                    lastPayoutDate: new Date(),
                    payoutTransactionId: new mongoose_2.Types.ObjectId().toHexString(),
                    remarks: "Payout processed successfully"
                },
                $inc: {
                    totalEarnings: driver.totalEarnings
                }
            }, { upsert: true, new: true });
            results.push({
                driverId: driver._id,
                totalEarnings: driver.totalEarnings,
                payoutMethod: payoutDetails.method,
                payoutAccount: payoutDetails.accountNumber,
                ridesPaid: driver.rides.length,
                driverPayment
            });
        }
        return {
            success: true,
            message: "Driver payouts processed",
            statusCode: 200,
            data: results
        };
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(ride_schema_1.Ride.name)),
    __param(2, (0, mongoose_1.InjectModel)(payment_schema_1.Payment.name)),
    __param(3, (0, mongoose_1.InjectModel)(payout_schema_1.DriverPayout.name)),
    __param(4, (0, mongoose_1.InjectModel)(driver_earnings_schema_1.DriverEarning.name)),
    __param(5, (0, mongoose_1.InjectModel)(DriverPaymentInfo_schema_1.DriverPayment.name)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        invoice_service_1.InvoiceService,
        cloudinary_service_1.CloudinaryService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map