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
let PaymentController = class PaymentController {
    paymentService;
    rideModel;
    totalAmount;
    rideId;
    constructor(paymentService, rideModel) {
        this.paymentService = paymentService;
        this.rideModel = rideModel;
    }
    handleCreatePaymentSession() {
        return this.paymentService.createCheckoutSession("http://localhost:3000/stripe/success", "http://localhost:3000/stripe/cancel", this.totalAmount, this.rideId);
    }
    handlePaymentSucess() {
        return "Thank you for placing order...";
    }
    handlePaymentCancel() {
        return "Forgot to add something in cart? Add and come back to place order...";
    }
    async handleWebhook(req) {
        const sig = req.headers['stripe-signature'];
        try {
            await this.paymentService.handleWebhook(req.body, sig);
            return { received: true };
        }
        catch (err) {
            throw new common_1.BadRequestException(`Webhook Error: ${err.message}`);
        }
    }
    handleRefund(intentId) {
        this.paymentService.handleRefund(intentId);
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
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PaymentController.prototype, "handleCreatePaymentSession", null);
__decorate([
    (0, common_1.Get)("success"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PaymentController.prototype, "handlePaymentSucess", null);
__decorate([
    (0, common_1.Get)("cancel"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PaymentController.prototype, "handlePaymentCancel", null);
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Request]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "handleWebhook", null);
__decorate([
    (0, common_1.Delete)("refund/:intentId"),
    __param(0, (0, common_1.Param)('intentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PaymentController.prototype, "handleRefund", null);
__decorate([
    (0, common_1.Post)("create-subscription"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_subscription_dto_1.CreateSubscriptionDto]),
    __metadata("design:returntype", void 0)
], PaymentController.prototype, "handleCreateSubscription", null);
__decorate([
    (0, common_1.Post)("create-subscription-by-checkout"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_subscription_dto_1.CreateSubscriptionDto]),
    __metadata("design:returntype", void 0)
], PaymentController.prototype, "handleCreateSubscriptionByCheckout", null);
__decorate([
    (0, common_1.Put)("update-subscription"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_subscription_dto_1.UpdateSubscriptionDto]),
    __metadata("design:returntype", void 0)
], PaymentController.prototype, "handleUpdateSubscription", null);
__decorate([
    (0, common_1.Delete)("delete-subscription/:subscriptionId"),
    __param(0, (0, common_1.Param)('subscriptionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PaymentController.prototype, "handleDeleteSubscription", null);
__decorate([
    (0, common_1.Get)("customer-subscriptions/:customerId"),
    __param(0, (0, common_1.Param)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PaymentController.prototype, "handleGetCustomerSubscriptions", null);
exports.PaymentController = PaymentController = __decorate([
    (0, common_1.Controller)('stripe'),
    __param(1, (0, mongoose_1.InjectModel)(ride_schema_1.Ride.name)),
    __metadata("design:paramtypes", [payment_service_1.PaymentService,
        mongoose_2.Model])
], PaymentController);
//# sourceMappingURL=payment.controller.js.map