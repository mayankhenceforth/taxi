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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const get_users_dto_1 = require("./dto/get-users.dto");
const create_admin_dto_1 = require("./dto/create-admin.dto");
const role_decorator_1 = require("../../comman/decorator/role.decorator");
const auth_guards_1 = require("../../comman/guards/auth.guards");
const role_guards_1 = require("../../comman/guards/role.guards");
const role_enum_1 = require("../../comman/enums/role.enum");
const swagger_1 = require("@nestjs/swagger");
const delete_entry_dto_1 = require("./dto/delete-entry.dto");
const update_admin_dto_1 = require("./dto/update-admin.dto");
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    getUsers(getUsersDto) {
        return this.adminService.getUsersDetails(getUsersDto);
    }
    createNewAdmin(createNewEntryDto) {
        return this.adminService.createNewEntry(createNewEntryDto, role_enum_1.Role.Admin);
    }
    createNewUser(createNewEntryDto) {
        return this.adminService.createNewEntry(createNewEntryDto, role_enum_1.Role.User);
    }
    deleteAdmin(deleteEntryDto) {
        return this.adminService.deleteEntry(deleteEntryDto, role_enum_1.Role.Admin);
    }
    deleteUser(deleteEntryDto) {
        return this.adminService.deleteEntry(deleteEntryDto, role_enum_1.Role.User);
    }
    updateAdminDetails(updateEntryDto) {
        return this.adminService.deleteEntry(updateEntryDto, role_enum_1.Role.Admin);
    }
    updateUserDetails(updateEntryDto) {
        return this.adminService.updateEntry(updateEntryDto, role_enum_1.Role.User);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('users'),
    (0, role_decorator_1.Roles)(role_enum_1.Role.Admin, role_enum_1.Role.SuperAdmin),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_users_dto_1.GetUsersDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Post)("create-admin"),
    (0, role_decorator_1.Roles)(role_enum_1.Role.SuperAdmin),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_admin_dto_1.CreateNewEntryDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createNewAdmin", null);
__decorate([
    (0, common_1.Post)("create-user"),
    (0, role_decorator_1.Roles)(role_enum_1.Role.Admin, role_enum_1.Role.SuperAdmin),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_admin_dto_1.CreateNewEntryDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createNewUser", null);
__decorate([
    (0, common_1.Delete)("delete-admin/:_id"),
    (0, role_decorator_1.Roles)(role_enum_1.Role.SuperAdmin),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [delete_entry_dto_1.DeleteEntryDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteAdmin", null);
__decorate([
    (0, common_1.Delete)("delete-user/:_id"),
    (0, role_decorator_1.Roles)(role_enum_1.Role.Admin, role_enum_1.Role.SuperAdmin),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [delete_entry_dto_1.DeleteEntryDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Patch)("update-admin"),
    (0, role_decorator_1.Roles)(role_enum_1.Role.SuperAdmin),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_admin_dto_1.UpdateEntryDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateAdminDetails", null);
__decorate([
    (0, common_1.Patch)("update-user"),
    (0, role_decorator_1.Roles)(role_enum_1.Role.Admin, role_enum_1.Role.SuperAdmin),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_admin_dto_1.UpdateEntryDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateUserDetails", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(auth_guards_1.AuthGuards, role_guards_1.RoleGuards),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map