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
exports.PaymentController = void 0;
const common_1 = require("@nestjs/common");
const payment_service_1 = require("./payment.service");
const create_subscription_dto_1 = require("./dto/create-subscription.dto");
const update_subscription_dto_1 = require("./dto/update-subscription.dto");
const mongoose_1 = require("@nestjs/mongoose");
const ride_schema_1 = require("../schema/ride.schema");
const mongoose_2 = require("mongoose");
const swagger_1 = require("@nestjs/swagger");
let PaymentController = class PaymentController {
    paymentService;
    rideModel;
    totalAmount;
    rideId;
    constructor(paymentService, rideModel) {
        this.paymentService = paymentService;
        this.rideModel = rideModel;
    }
    handleCreatePaymentSession(amount, rideId) {
        const paymentAmount = amount || this.totalAmount;
        const associatedRideId = rideId || this.rideId;
        return this.paymentService.createCheckoutSession("http://localhost:3000/stripe/success", "http://localhost:3000/stripe/cancel", paymentAmount, associatedRideId);
    }
    handlePaymentSuccess() {
        return "Thank you for your payment. Your ride has been confirmed!";
    }
    handlePaymentCancel() {
        return "Payment was cancelled. You can try again if you still want to confirm your ride.";
    }
    async handleWebhook(req, sig) {
        try {
            await this.paymentService.handleWebhook(req.body, sig);
            return { received: true, message: 'Webhook processed successfully' };
        }
        catch (err) {
            throw new common_1.BadRequestException(`Webhook Error: ${err.message}`);
        }
    }
    async handleRefund(intentId, rideId) {
        return this.paymentService.handleRefund(intentId, rideId);
    }
    handleCreateSubscription(createSubscriptionDto) {
        return this.paymentService.createSubscription(createSubscriptionDto.customerId, createSubscriptionDto.priceId);
    }
    handleCreateSubscriptionByCheckout(createSubscriptionDto) {
        return this.paymentService.createSubscriptionWithCheckout(createSubscriptionDto.priceId, createSubscriptionDto.customerId, "http://localhost:3000/stripe/success", "http://localhost:3000/stripe/cancel");
    }
    handleUpdateSubscription(updateSubscriptionDto) {
        return this.paymentService.handleUpdateSubscriptionStatus(updateSubscriptionDto.subscriptionId, updateSubscriptionDto.priceId);
    }
    handleDeleteSubscription(subscriptionId) {
        return this.paymentService.handleDeleteSubscription(subscriptionId);
    }
    handleGetCustomerSubscriptions(customerId) {
        return this.paymentService.getUserSubscriptions(customerId);
    }
};
exports.PaymentController = PaymentController;
__decorate([
    (0, common_1.Get)("create-checkout-session"),
    (0, swagger_1.ApiOperation)({
        summary: 'Create checkout session',
        description: 'Create a Stripe checkout session for payment processing. Returns a session ID for client-side redirection.'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'amount',
        required: false,
        type: Number,
        description: 'Payment amount in smallest currency unit (e.g., cents for USD)'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'rideId',
        required: false,
        type: String,
        description: 'Ride ID associated with this payment'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Checkout session created successfully',
        schema: {
            type: 'object',
            properties: {
                sessionId: { type: 'string', example: 'cs_test_abc123' },
                url: { type: 'string', example: 'https://checkout.stripe.com/c/pay/cs_test_abc123' }
            }
        }
    }),
    __param(0, (0, common_1.Query)('amount')),
    __param(1, (0, common_1.Query)('rideId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], PaymentController.prototype, "handleCreatePaymentSession", null);
__decorate([
    (0, common_1.Get)("success"),
    (0, swagger_1.ApiOperation)({
        summary: 'Payment success page',
        description: 'Redirect endpoint for successful payments. Displays confirmation message to users.'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Payment success page rendered' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PaymentController.prototype, "handlePaymentSuccess", null);
__decorate([
    (0, common_1.Get)("cancel"),
    (0, swagger_1.ApiOperation)({
        summary: 'Payment cancellation page',
        description: 'Redirect endpoint for cancelled payments. Allows users to retry payment.'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Payment cancellation page rendered' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PaymentController.prototype, "handlePaymentCancel", null);
__decorate([
    (0, common_1.Post)('webhook'),
    (0, swagger_1.ApiOperation)({
        summary: 'Stripe webhook handler',
        description: 'Endpoint for Stripe webhook events. Handles payment events like successful charges, refunds, etc.'
    }),
    (0, swagger_1.ApiHeader)({
        name: 'stripe-signature',
        description: 'Stripe signature header for webhook verification',
        required: true
    }),
    (0, swagger_1.ApiBody)({
        description: 'Raw webhook event data from Stripe',
        required: true
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Webhook processed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid webhook signature' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('stripe-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "handleWebhook", null);
__decorate([
    (0, common_1.Delete)("refund/:intentId/:rideId"),
    (0, swagger_1.ApiOperation)({
        summary: 'Process payment refund',
        description: 'Initiate a refund for a specific payment intent. Requires payment intent ID and associated ride ID.'
    }),
    (0, swagger_1.ApiParam)({
        name: 'intentId',
        type: String,
        description: 'Stripe Payment Intent ID to refund'
    }),
    (0, swagger_1.ApiParam)({
        name: 'rideId',
        type: String,
        description: 'Ride ID associated with the payment'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Refund processed successfully',
        schema: {
            type: 'object',
            properties: {
                refundId: { type: 'string', example: 're_abc123' },
                status: { type: 'string', example: 'succeeded' },
                amount: { type: 'number', example: 2500 }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Payment intent or ride not found' }),
    __param(0, (0, common_1.Param)("intentId")),
    __param(1, (0, common_1.Param)("rideId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "handleRefund", null);
__decorate([
    (0, common_1.Post)("create-subscription"),
    (0, swagger_1.ApiOperation)({
        summary: 'Create subscription',
        description: 'Create a new subscription for a customer using price ID. For recurring payments.'
    }),
    (0, swagger_1.ApiBody)({ type: create_subscription_dto_1.CreateSubscriptionDto }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Subscription created successfully',
        schema: {
            type: 'object',
            properties: {
                subscriptionId: { type: 'string', example: 'sub_abc123' },
                status: { type: 'string', example: 'active' }
            }
        }
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_subscription_dto_1.CreateSubscriptionDto]),
    __metadata("design:returntype", void 0)
], PaymentController.prototype, "handleCreateSubscription", null);
__decorate([
    (0, common_1.Post)("create-subscription-by-checkout"),
    (0, swagger_1.ApiOperation)({
        summary: 'Create subscription via checkout',
        description: 'Create a subscription using Stripe Checkout for better user experience.'
    }),
    (0, swagger_1.ApiBody)({ type: create_subscription_dto_1.CreateSubscriptionDto }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Checkout session created for subscription',
        schema: {
            type: 'object',
            properties: {
                sessionId: { type: 'string', example: 'cs_test_abc123' },
                url: { type: 'string', example: 'https://checkout.stripe.com/c/pay/cs_test_abc123' }
            }
        }
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_subscription_dto_1.CreateSubscriptionDto]),
    __metadata("design:returntype", void 0)
], PaymentController.prototype, "handleCreateSubscriptionByCheckout", null);
__decorate([
    (0, common_1.Put)("update-subscription"),
    (0, swagger_1.ApiOperation)({
        summary: 'Update subscription',
        description: 'Update an existing subscription (e.g., change plan, update payment method).'
    }),
    (0, swagger_1.ApiBody)({ type: update_subscription_dto_1.UpdateSubscriptionDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Subscription updated successfully',
        schema: {
            type: 'object',
            properties: {
                subscriptionId: { type: 'string', example: 'sub_abc123' },
                status: { type: 'string', example: 'active' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Subscription not found' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_subscription_dto_1.UpdateSubscriptionDto]),
    __metadata("design:returntype", void 0)
], PaymentController.prototype, "handleUpdateSubscription", null);
__decorate([
    (0, common_1.Delete)("delete-subscription/:subscriptionId"),
    (0, swagger_1.ApiOperation)({
        summary: 'Cancel subscription',
        description: 'Cancel an existing subscription. The subscription will remain active until the end of the current billing period.'
    }),
    (0, swagger_1.ApiParam)({
        name: 'subscriptionId',
        type: String,
        description: 'Stripe Subscription ID to cancel'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Subscription cancelled successfully',
        schema: {
            type: 'object',
            properties: {
                subscriptionId: { type: 'string', example: 'sub_abc123' },
                status: { type: 'string', example: 'canceled' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Subscription not found' }),
    __param(0, (0, common_1.Param)('subscriptionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PaymentController.prototype, "handleDeleteSubscription", null);
__decorate([
    (0, common_1.Get)("customer-subscriptions/:customerId"),
    (0, swagger_1.ApiOperation)({
        summary: 'Get customer subscriptions',
        description: 'Retrieve all active subscriptions for a specific customer.'
    }),
    (0, swagger_1.ApiParam)({
        name: 'customerId',
        type: String,
        description: 'Stripe Customer ID'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Subscriptions retrieved successfully',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    status: { type: 'string' },
                    currentPeriodStart: { type: 'number' },
                    currentPeriodEnd: { type: 'number' },
                    plan: { type: 'object' }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Customer not found' }),
    __param(0, (0, common_1.Param)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PaymentController.prototype, "handleGetCustomerSubscriptions", null);
exports.PaymentController = PaymentController = __decorate([
    (0, common_1.Controller)('stripe'),
    (0, swagger_1.ApiTags)('Stripe Payment Processing'),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad Request - Invalid input data' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal Server Error - Payment gateway issue' }),
    __param(1, (0, mongoose_1.InjectModel)(ride_schema_1.Ride.name)),
    __metadata("design:paramtypes", [payment_service_1.PaymentService,
        mongoose_2.Model])
], PaymentController);
//# sourceMappingURL=payment.controller.js.map