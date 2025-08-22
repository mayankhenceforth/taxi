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
exports.RideController = void 0;
const common_1 = require("@nestjs/common");
const ride_service_1 = require("./ride.service");
const create_ride_dto_1 = require("./dto/create-ride.dto");
const swagger_1 = require("@nestjs/swagger");
const role_decorator_1 = require("../../comman/decorator/role.decorator");
const role_enum_1 = require("../../comman/enums/role.enum");
const auth_guards_1 = require("../../comman/guards/auth.guards");
const role_guards_1 = require("../../comman/guards/role.guards");
const verify_ride_otp_dto_1 = require("./dto/verify-ride-otp.dto");
const cencel_ride_dto_1 = require("./dto/cencel-ride.dto");
const payment_service_1 = require("../../comman/payment/payment.service");
const invoice_service_1 = require("../../comman/invoice/invoice.service");
let RideController = class RideController {
    rideService;
    paymentService;
    invoiceService;
    constructor(rideService, paymentService, invoiceService) {
        this.rideService = rideService;
        this.paymentService = paymentService;
        this.invoiceService = invoiceService;
    }
    create(request, createRideDto) {
        return this.rideService.createRide(request, createRideDto);
    }
    handleAcceptRide(rideId, request) {
        return this.rideService.acceptRide(rideId, request);
    }
    handleOtpRide(rideId, request, verifyRideOtpDto) {
        return this.rideService.verifyRideOtp(rideId, request, verifyRideOtpDto, role_enum_1.Role.Driver);
    }
    handleCancelRide(rideId, request, cancelRideDto) {
        if (!cancelRideDto.reason || cancelRideDto.reason.trim() === '') {
            throw new common_1.BadRequestException('Cancellation reason is required');
        }
        return this.rideService.cencelRide(rideId, request, cancelRideDto.reason);
    }
    async handlePaymentRide(rideId, request) {
        return this.rideService.paymentRide(rideId, request);
    }
    async confirmRidePayment(rideId, res) {
        const pdfBuffer = await this.rideService.confirmPayment(rideId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${rideId}.pdf`);
        res.end(pdfBuffer);
    }
    async handlePaymentcomplete(rideId, request) {
        return this.rideService.rideComplete(rideId, request);
    }
};
exports.RideController = RideController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, role_decorator_1.Roles)(role_enum_1.Role.User),
    (0, common_1.UseGuards)(auth_guards_1.AuthGuards, role_guards_1.RoleGuards),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_ride_dto_1.CreateRideDto]),
    __metadata("design:returntype", void 0)
], RideController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, role_decorator_1.Roles)(role_enum_1.Role.Driver),
    (0, common_1.UseGuards)(auth_guards_1.AuthGuards, role_guards_1.RoleGuards),
    (0, common_1.Get)('accept/:rideId'),
    __param(0, (0, common_1.Param)('rideId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RideController.prototype, "handleAcceptRide", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, role_decorator_1.Roles)(role_enum_1.Role.Driver),
    (0, common_1.UseGuards)(auth_guards_1.AuthGuards, role_guards_1.RoleGuards),
    (0, common_1.Patch)('/:rideId/verify-otp'),
    __param(0, (0, common_1.Param)('rideId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, verify_ride_otp_dto_1.VerifyRideOtpDto]),
    __metadata("design:returntype", void 0)
], RideController.prototype, "handleOtpRide", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, role_decorator_1.Roles)(role_enum_1.Role.User, role_enum_1.Role.Driver),
    (0, common_1.UseGuards)(auth_guards_1.AuthGuards, role_guards_1.RoleGuards),
    (0, common_1.Post)(':rideId/cancel'),
    __param(0, (0, common_1.Param)('rideId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, cencel_ride_dto_1.cencelRideDto]),
    __metadata("design:returntype", void 0)
], RideController.prototype, "handleCancelRide", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, role_decorator_1.Roles)(role_enum_1.Role.User),
    (0, common_1.UseGuards)(auth_guards_1.AuthGuards, role_guards_1.RoleGuards),
    (0, common_1.Get)(':rideId/payment'),
    __param(0, (0, common_1.Param)('rideId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RideController.prototype, "handlePaymentRide", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, role_decorator_1.Roles)(role_enum_1.Role.User),
    (0, common_1.UseGuards)(auth_guards_1.AuthGuards, role_guards_1.RoleGuards),
    (0, common_1.Get)(':rideId/confirm-payment'),
    __param(0, (0, common_1.Param)('rideId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RideController.prototype, "confirmRidePayment", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, role_decorator_1.Roles)(role_enum_1.Role.User),
    (0, common_1.UseGuards)(auth_guards_1.AuthGuards, role_guards_1.RoleGuards),
    (0, common_1.Get)(':rideId/payment'),
    __param(0, (0, common_1.Param)('rideId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RideController.prototype, "handlePaymentcomplete", null);
exports.RideController = RideController = __decorate([
    (0, common_1.Controller)('ride'),
    __metadata("design:paramtypes", [ride_service_1.RideService,
        payment_service_1.PaymentService,
        invoice_service_1.InvoiceService])
], RideController);
//# sourceMappingURL=ride.controller.js.map