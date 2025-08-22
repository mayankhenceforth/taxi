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
const CreatePaymentAccount_dt_o_1 = require("./dto/CreatePaymentAccount.dt.o");
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
    }
};
exports.DriverController = DriverController;
__decorate([
    (0, common_1.Post)('setup-account'),
    (0, swagger_1.ApiOperation)({ summary: 'Setup driver account with vehicle details' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, SetupDriverAccount_dto_1.SetupDriverAccountDto]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "setupDriverAccount", null);
__decorate([
    (0, common_1.Post)('payout-account'),
    (0, swagger_1.ApiOperation)({ summary: 'Create payout account for driver' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreatePaymentAccount_dt_o_1.CreateDriverPayoutDto]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "createPayoutAccount", null);
__decorate([
    (0, common_1.Get)('earnings'),
    (0, swagger_1.ApiOperation)({ summary: 'Get driver earnings' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "getDriverEarnings", null);
exports.DriverController = DriverController = __decorate([
    (0, swagger_1.ApiTags)('Driver'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, role_decorator_1.Roles)(role_enum_1.Role.Driver),
    (0, common_1.UseGuards)(auth_guards_1.AuthGuards, role_guards_1.RoleGuards),
    (0, common_1.Controller)('driver'),
    __metadata("design:paramtypes", [driver_service_1.DriverService])
], DriverController);
//# sourceMappingURL=driver.controller.js.map