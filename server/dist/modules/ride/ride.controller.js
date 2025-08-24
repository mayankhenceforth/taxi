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
const rating_dto_1 = require("./dto/rating.dto");
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
    handleCancelRide(rideId, request, cancelRideDto) {
        if (!cancelRideDto.reason || cancelRideDto.reason.trim() === '') {
            throw new common_1.BadRequestException('Cancellation reason is required');
        }
        return this.rideService.cencelRide(rideId, request, cancelRideDto.reason);
    }
    handleDriverArrive(rideId, request) {
        return this.rideService.driverArrive(rideId, request);
    }
    handleOtpRide(rideId, request, verifyRideOtpDto) {
        return this.rideService.verifyRideOtp(rideId, request, verifyRideOtpDto, role_enum_1.Role.Driver);
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
    async handleRideRating(rideId, request, ratingDto) {
        return this.rideService.rideRating(rideId, request, ratingDto);
    }
};
exports.RideController = RideController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, role_decorator_1.Roles)(role_enum_1.Role.User),
    (0, common_1.UseGuards)(auth_guards_1.AuthGuards, role_guards_1.RoleGuards),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new ride',
        description: 'Allows a user to create a new ride request.',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Ride created successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid ride details.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized access.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'User role required.' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_ride_dto_1.CreateRideDto]),
    __metadata("design:returntype", void 0)
], RideController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('accept/:rideId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, role_decorator_1.Roles)(role_enum_1.Role.Driver),
    (0, common_1.UseGuards)(auth_guards_1.AuthGuards, role_guards_1.RoleGuards),
    (0, swagger_1.ApiOperation)({
        summary: 'Accept a ride',
        description: 'Allows a driver to accept a ride request.',
    }),
    (0, swagger_1.ApiParam)({ name: 'rideId', type: String, description: 'Ride ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Ride accepted successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized access.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Driver role required.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Ride not found.' }),
    __param(0, (0, common_1.Param)('rideId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RideController.prototype, "handleAcceptRide", null);
__decorate([
    (0, common_1.Post)(':rideId/cancel'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, role_decorator_1.Roles)(role_enum_1.Role.User, role_enum_1.Role.Driver),
    (0, common_1.UseGuards)(auth_guards_1.AuthGuards, role_guards_1.RoleGuards),
    (0, swagger_1.ApiOperation)({
        summary: 'Cancel a ride',
        description: 'Allows a user or driver to cancel a ride with a reason.',
    }),
    (0, swagger_1.ApiParam)({ name: 'rideId', type: String, description: 'Ride ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Ride cancelled successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Cancellation reason is required.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized access.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'User or Driver role required.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Ride not found.' }),
    (0, swagger_1.ApiBody)({ type: cencel_ride_dto_1.cencelRideDto }),
    __param(0, (0, common_1.Param)('rideId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, cencel_ride_dto_1.cencelRideDto]),
    __metadata("design:returntype", void 0)
], RideController.prototype, "handleCancelRide", null);
__decorate([
    (0, common_1.Get)(':rideId/arrive'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, role_decorator_1.Roles)(role_enum_1.Role.Driver),
    (0, common_1.UseGuards)(auth_guards_1.AuthGuards, role_guards_1.RoleGuards),
    (0, swagger_1.ApiOperation)({
        summary: 'Driver marks arrival',
        description: 'Allows a driver to mark that they have arrived at the pickup location.',
    }),
    (0, swagger_1.ApiParam)({ name: 'rideId', type: String, description: 'Ride ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Driver marked as arrived successfully.',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized access.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Driver role required.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Ride not found.' }),
    __param(0, (0, common_1.Param)('rideId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RideController.prototype, "handleDriverArrive", null);
__decorate([
    (0, common_1.Patch)('/:rideId/verify-otp'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, role_decorator_1.Roles)(role_enum_1.Role.Driver),
    (0, common_1.UseGuards)(auth_guards_1.AuthGuards, role_guards_1.RoleGuards),
    (0, swagger_1.ApiOperation)({
        summary: 'Verify ride OTP',
        description: 'Verifies the ride using the provided OTP by the driver.',
    }),
    (0, swagger_1.ApiParam)({ name: 'rideId', type: String, description: 'Ride ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Ride OTP verified successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid OTP.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized access.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Driver role required.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Ride not found.' }),
    __param(0, (0, common_1.Param)('rideId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, verify_ride_otp_dto_1.VerifyRideOtpDto]),
    __metadata("design:returntype", void 0)
], RideController.prototype, "handleOtpRide", null);
__decorate([
    (0, common_1.Get)(':rideId/payment'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, role_decorator_1.Roles)(role_enum_1.Role.User),
    (0, common_1.UseGuards)(auth_guards_1.AuthGuards, role_guards_1.RoleGuards),
    (0, swagger_1.ApiOperation)({
        summary: 'Initiate ride payment',
        description: 'Initiates the payment process for a ride.',
    }),
    (0, swagger_1.ApiParam)({ name: 'rideId', type: String, description: 'Ride ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Payment initiated successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized access.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'User role required.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Ride not found.' }),
    __param(0, (0, common_1.Param)('rideId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RideController.prototype, "handlePaymentRide", null);
__decorate([
    (0, common_1.Get)(':rideId/confirm-payment'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, role_decorator_1.Roles)(role_enum_1.Role.User),
    (0, common_1.UseGuards)(auth_guards_1.AuthGuards, role_guards_1.RoleGuards),
    (0, swagger_1.ApiOperation)({
        summary: 'Confirm ride payment and download invoice',
        description: 'Confirms the payment for a ride and returns a PDF invoice.',
    }),
    (0, swagger_1.ApiParam)({ name: 'rideId', type: String, description: 'Ride ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Payment confirmed, invoice PDF returned.',
        content: { 'application/pdf': {} },
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized access.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'User role required.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Ride not found.' }),
    __param(0, (0, common_1.Param)('rideId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RideController.prototype, "confirmRidePayment", null);
__decorate([
    (0, common_1.Get)(':rideId/complete'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, role_decorator_1.Roles)(role_enum_1.Role.Driver),
    (0, common_1.UseGuards)(auth_guards_1.AuthGuards, role_guards_1.RoleGuards),
    (0, swagger_1.ApiOperation)({
        summary: 'Complete a ride',
        description: 'Marks a ride as completed for the user.',
    }),
    (0, swagger_1.ApiParam)({ name: 'rideId', type: String, description: 'Ride ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Ride marked as completed.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized access.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'User role required.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Ride not found.' }),
    __param(0, (0, common_1.Param)('rideId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RideController.prototype, "handlePaymentcomplete", null);
__decorate([
    (0, common_1.Post)(":rideId/rating"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, role_decorator_1.Roles)(role_enum_1.Role.User),
    (0, common_1.UseGuards)(auth_guards_1.AuthGuards, role_guards_1.RoleGuards),
    (0, swagger_1.ApiParam)({ name: 'rideId', type: String, description: 'Ride ID' }),
    __param(0, (0, common_1.Param)('rideId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, rating_dto_1.RideRatingDto]),
    __metadata("design:returntype", Promise)
], RideController.prototype, "handleRideRating", null);
exports.RideController = RideController = __decorate([
    (0, swagger_1.ApiTags)('Ride'),
    (0, common_1.Controller)('ride'),
    __metadata("design:paramtypes", [ride_service_1.RideService,
        payment_service_1.PaymentService,
        invoice_service_1.InvoiceService])
], RideController);
//# sourceMappingURL=ride.controller.js.map