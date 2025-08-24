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
exports.DriverController = void 0;
const common_1 = require("@nestjs/common");
const driver_service_1 = require("./driver.service");
const SetupDriverAccount_dto_1 = require("./dto/SetupDriverAccount.dto");
const CreatePaymentAccount_dto_1 = require("./dto/CreatePaymentAccount.dto");
const swagger_1 = require("@nestjs/swagger");
const auth_guards_1 = require("../../comman/guards/auth.guards");
const role_guards_1 = require("../../comman/guards/role.guards");
const role_decorator_1 = require("../../comman/decorator/role.decorator");
const role_enum_1 = require("../../comman/enums/role.enum");
let DriverController = class DriverController {
    driverService;
    constructor(driverService) {
        this.driverService = driverService;
    }
    async setupDriverAccount(req, setupDriverAccountDto) {
        return this.driverService.setupDriverAccount(req, setupDriverAccountDto);
    }
    async createPayoutAccount(req, createDriverPayoutDto) {
        return this.driverService.createPaymentAccount(req, createDriverPayoutDto);
    }
    async getDriverEarnings(req) {
        return this.driverService.getDriverEarnings(req);
    }
    async getDriverEarningsHistory(req, page = 1, limit = 10) {
        return this.driverService.getDriverEarningsHistory(req, page, limit);
    }
};
exports.DriverController = DriverController;
__decorate([
    (0, common_1.Post)('setup-account'),
    (0, swagger_1.ApiOperation)({
        summary: 'Set up driver account',
        description: 'Allows a driver to set up their account with vehicle and personal details.'
    }),
    (0, swagger_1.ApiBody)({ type: SetupDriverAccount_dto_1.SetupDriverAccountDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Driver account set up successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input data.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized access.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Driver role required.' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, SetupDriverAccount_dto_1.SetupDriverAccountDto]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "setupDriverAccount", null);
__decorate([
    (0, common_1.Post)('payout-account'),
    (0, swagger_1.ApiOperation)({
        summary: 'Create driver payout account',
        description: 'Sets up a payout account for the driver to receive earnings.'
    }),
    (0, swagger_1.ApiBody)({ type: CreatePaymentAccount_dto_1.CreateDriverPayoutDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Payout account created successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid payout account details.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized access.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Driver role required.' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreatePaymentAccount_dto_1.CreateDriverPayoutDto]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "createPayoutAccount", null);
__decorate([
    (0, common_1.Get)('earnings'),
    (0, swagger_1.ApiOperation)({
        summary: 'Retrieve driver earnings',
        description: 'Fetches the total earnings for the authenticated driver.'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Driver earnings retrieved successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized access.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Driver role required.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Driver earnings not found.' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "getDriverEarnings", null);
__decorate([
    (0, common_1.Get)('earnings/history'),
    (0, swagger_1.ApiOperation)({
        summary: 'Retrieve driver earnings history',
        description: 'Fetches the paginated earnings history for the authenticated driver.'
    }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Earnings history retrieved successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid pagination parameters.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized access.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Driver role required.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'No earnings history found.' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "getDriverEarningsHistory", null);
exports.DriverController = DriverController = __decorate([
    (0, swagger_1.ApiTags)('Driver'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, role_decorator_1.Roles)(role_enum_1.Role.Driver),
    (0, common_1.UseGuards)(auth_guards_1.AuthGuards, role_guards_1.RoleGuards),
    (0, common_1.Controller)('driver'),
    __metadata("design:paramtypes", [driver_service_1.DriverService])
], DriverController);
//# sourceMappingURL=driver.controller.js.map