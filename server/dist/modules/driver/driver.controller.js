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
const role_enum_1 = require("../../comman/enums/role.enum");
const role_decorator_1 = require("../../comman/decorator/role.decorator");
const auth_guards_1 = require("../../comman/guards/auth.guards");
const role_guards_1 = require("../../comman/guards/role.guards");
const SetupDriverAccount_dto_1 = require("./dto/SetupDriverAccount.dto");
const swagger_1 = require("@nestjs/swagger");
const driver_service_1 = require("./driver.service");
let DriverController = class DriverController {
    driverService;
    constructor(driverService) {
        this.driverService = driverService;
    }
    setupDriverAccount(request, setupDriverAccountDto) {
        return this.driverService.setupDriverAccount(request, setupDriverAccountDto);
    }
};
exports.DriverController = DriverController;
__decorate([
    (0, common_1.Post)(),
    (0, role_decorator_1.Roles)(role_enum_1.Role.Driver),
    (0, common_1.UseGuards)(auth_guards_1.AuthGuards, role_guards_1.RoleGuards),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, SetupDriverAccount_dto_1.SetupDriverAccountDto]),
    __metadata("design:returntype", void 0)
], DriverController.prototype, "setupDriverAccount", null);
exports.DriverController = DriverController = __decorate([
    (0, common_1.Controller)('driver'),
    __metadata("design:paramtypes", [driver_service_1.DriverService])
], DriverController);
//# sourceMappingURL=driver.controller.js.map