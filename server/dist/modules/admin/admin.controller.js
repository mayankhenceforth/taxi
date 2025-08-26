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
        return this.adminService.getUsersDetails();
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
        return this.adminService.updateEntry(updateEntryDto, role_enum_1.Role.Admin);
    }
    updateUserDetails(updateEntryDto) {
        return this.adminService.updateEntry(updateEntryDto, role_enum_1.Role.User);
    }
    getRideDetails() {
        return this.adminService.getAllRideDetails();
    }
    getTemporaryRideDetails() {
        return this.adminService.getAllTemporaryRideDetails();
    }
    getAllRideWithStatus(body) {
        return this.adminService.getAllRideWithStatus(body.status);
    }
    getRideInvoice(rideId) {
        return this.adminService.getRideInvoice(rideId);
    }
    async getTotalEarning(filter, res) {
        const pdfBuffer = await this.adminService.getTotalEarning(filter);
        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="total-income-${filter || 'all'}.pdf"`,
            "Content-Length": pdfBuffer.length.toString(),
        });
        return res.end(pdfBuffer);
    }
    async getNewUsers(filter, res) {
        const pdfBuffer = await this.adminService.getNewUsers(filter);
        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="new-users-${filter || 'all'}.pdf"`,
            "Content-Length": pdfBuffer.length.toString(),
        });
        return res.end(pdfBuffer);
    }
    async getNewRides(filter, res) {
        const pdfBuffer = await this.adminService.getNewRides(filter);
        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="new-rides-${filter || 'all'}.pdf"`,
            "Content-Length": pdfBuffer.length.toString(),
        });
        return res.end(pdfBuffer);
    }
    processRefund(rideId) {
        return this.adminService.processRefund(rideId);
    }
    payDriver() {
        return this.adminService.payAllDrivers();
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('users'),
    (0, role_decorator_1.Roles)(role_enum_1.Role.Admin, role_enum_1.Role.SuperAdmin),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all users',
        description: 'Retrieve a list of all users in the system. Requires Admin or SuperAdmin role.'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'page',
        required: false,
        type: Number,
        description: 'Page number for pagination'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Number of items per page'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Successfully retrieved users list' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_users_dto_1.GetUsersDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Post)("create-admin"),
    (0, role_decorator_1.Roles)(role_enum_1.Role.SuperAdmin),
    (0, swagger_1.ApiOperation)({
        summary: 'Create new admin',
        description: 'Create a new admin user. Requires SuperAdmin role.'
    }),
    (0, swagger_1.ApiBody)({ type: create_admin_dto_1.CreateNewEntryDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Admin created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - Invalid input data' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Conflict - User already exists' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_admin_dto_1.CreateNewEntryDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createNewAdmin", null);
__decorate([
    (0, common_1.Post)("create-user"),
    (0, role_decorator_1.Roles)(role_enum_1.Role.Admin, role_enum_1.Role.SuperAdmin),
    (0, swagger_1.ApiOperation)({
        summary: 'Create new user',
        description: 'Create a new regular user. Requires Admin or SuperAdmin role.'
    }),
    (0, swagger_1.ApiBody)({ type: create_admin_dto_1.CreateNewEntryDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'User created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - Invalid input data' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Conflict - User already exists' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_admin_dto_1.CreateNewEntryDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createNewUser", null);
__decorate([
    (0, common_1.Delete)("delete-admin/:_id"),
    (0, role_decorator_1.Roles)(role_enum_1.Role.SuperAdmin),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete admin',
        description: 'Delete an admin user by ID. Requires SuperAdmin role.'
    }),
    (0, swagger_1.ApiParam)({ name: '_id', type: String, description: 'MongoDB ObjectId of the admin to delete' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Admin deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Admin not found' }),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [delete_entry_dto_1.DeleteEntryDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteAdmin", null);
__decorate([
    (0, common_1.Delete)("delete-user/:_id"),
    (0, role_decorator_1.Roles)(role_enum_1.Role.Admin, role_enum_1.Role.SuperAdmin),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete user',
        description: 'Delete a regular user by ID. Requires Admin or SuperAdmin role.'
    }),
    (0, swagger_1.ApiParam)({ name: '_id', type: String, description: 'MongoDB ObjectId of the user to delete' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [delete_entry_dto_1.DeleteEntryDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Patch)("update-admin"),
    (0, role_decorator_1.Roles)(role_enum_1.Role.SuperAdmin),
    (0, swagger_1.ApiOperation)({
        summary: 'Update admin details',
        description: 'Update admin user information. Requires SuperAdmin role.'
    }),
    (0, swagger_1.ApiBody)({ type: update_admin_dto_1.UpdateEntryDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Admin updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - Invalid input data' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Admin not found' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_admin_dto_1.UpdateEntryDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateAdminDetails", null);
__decorate([
    (0, common_1.Patch)("update-user"),
    (0, role_decorator_1.Roles)(role_enum_1.Role.Admin, role_enum_1.Role.SuperAdmin),
    (0, swagger_1.ApiOperation)({
        summary: 'Update user details',
        description: 'Update regular user information. Requires Admin or SuperAdmin role.'
    }),
    (0, swagger_1.ApiBody)({ type: update_admin_dto_1.UpdateEntryDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - Invalid input data' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_admin_dto_1.UpdateEntryDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateUserDetails", null);
__decorate([
    (0, common_1.Get)("all_ride"),
    (0, role_decorator_1.Roles)(role_enum_1.Role.Admin, role_enum_1.Role.SuperAdmin),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all rides',
        description: 'Retrieve details of all rides in the system. Requires Admin or SuperAdmin role.'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Successfully retrieved rides list' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getRideDetails", null);
__decorate([
    (0, common_1.Get)("all_temp_ride"),
    (0, role_decorator_1.Roles)(role_enum_1.Role.Admin, role_enum_1.Role.SuperAdmin),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all temporary rides',
        description: 'Retrieve details of all temporary/unsaved rides. Requires Admin or SuperAdmin role.'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Successfully retrieved temporary rides list' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getTemporaryRideDetails", null);
__decorate([
    (0, common_1.Post)("all_ride_with_status"),
    (0, role_decorator_1.Roles)(role_enum_1.Role.Admin, role_enum_1.Role.SuperAdmin),
    (0, swagger_1.ApiOperation)({
        summary: 'Get rides by status',
        description: 'Retrieve rides filtered by specific status (completed, pending, cancelled, etc.). Requires Admin or SuperAdmin role.'
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    example: 'completed',
                    description: 'Ride status to filter by (completed, pending, cancelled, started)'
                }
            },
            required: ['status'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Successfully retrieved filtered rides' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - Invalid status provided' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getAllRideWithStatus", null);
__decorate([
    (0, common_1.Get)("ride_report/:rideId"),
    (0, role_decorator_1.Roles)(role_enum_1.Role.Admin, role_enum_1.Role.SuperAdmin),
    (0, swagger_1.ApiOperation)({
        summary: 'Get ride invoice',
        description: 'Generate and retrieve a detailed invoice PDF for a specific ride. Requires Admin or SuperAdmin role.'
    }),
    (0, swagger_1.ApiParam)({
        name: 'rideId',
        type: String,
        description: 'MongoDB ObjectId of the ride to generate invoice for'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Successfully generated ride invoice' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Ride not found' }),
    __param(0, (0, common_1.Param)('rideId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getRideInvoice", null);
__decorate([
    (0, common_1.Get)("total_earning_report/:filter"),
    (0, role_decorator_1.Roles)(role_enum_1.Role.Admin, role_enum_1.Role.SuperAdmin),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate total earnings report',
        description: 'Generate a PDF report of total earnings filtered by time period. Requires Admin or SuperAdmin role.'
    }),
    (0, swagger_1.ApiParam)({
        name: 'filter',
        type: String,
        description: 'Time filter for the report (1h, 1d, 1w, 1m, or empty for all time)',
        examples: {
            '1 hour': { value: '1h' },
            '1 day': { value: '1d' },
            '1 week': { value: '1w' },
            '1 month': { value: '1m' },
            'All time': { value: '' }
        }
    }),
    (0, swagger_1.ApiProduces)('application/pdf'),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'PDF report generated successfully',
        content: {
            'application/pdf': {
                schema: { type: 'string', format: 'binary' }
            }
        }
    }),
    __param(0, (0, common_1.Param)("filter")),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTotalEarning", null);
__decorate([
    (0, common_1.Get)("new_users_report/:filter"),
    (0, role_decorator_1.Roles)(role_enum_1.Role.Admin, role_enum_1.Role.SuperAdmin),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate new users report',
        description: 'Generate a PDF report of new users registered filtered by time period. Requires Admin or SuperAdmin role.'
    }),
    (0, swagger_1.ApiParam)({
        name: 'filter',
        type: String,
        description: 'Time filter for the report (1h, 1d, 1w, 1m, or empty for all time)',
        examples: {
            '1 hour': { value: '1h' },
            '1 day': { value: '1d' },
            '1 week': { value: '1w' },
            '1 month': { value: '1m' },
            'All time': { value: '' }
        }
    }),
    (0, swagger_1.ApiProduces)('application/pdf'),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'PDF report generated successfully',
        content: {
            'application/pdf': {
                schema: { type: 'string', format: 'binary' }
            }
        }
    }),
    __param(0, (0, common_1.Param)("filter")),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getNewUsers", null);
__decorate([
    (0, common_1.Get)("new_rides_report/:filter"),
    (0, role_decorator_1.Roles)(role_enum_1.Role.Admin, role_enum_1.Role.SuperAdmin),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate new rides report',
        description: 'Generate a PDF report of new rides created filtered by time period. Requires Admin or SuperAdmin role.'
    }),
    (0, swagger_1.ApiParam)({
        name: 'filter',
        type: String,
        description: 'Time filter for the report (1h, 1d, 1w, 1m, or empty for all time)',
        examples: {
            '1 hour': { value: '1h' },
            '1 day': { value: '1d' },
            '1 week': { value: '1w' },
            '1 month': { value: '1m' },
            'All time': { value: '' }
        }
    }),
    (0, swagger_1.ApiProduces)('application/pdf'),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'PDF report generated successfully',
        content: {
            'application/pdf': {
                schema: { type: 'string', format: 'binary' }
            }
        }
    }),
    __param(0, (0, common_1.Param)("filter")),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getNewRides", null);
__decorate([
    (0, common_1.Post)("payment_refund/:rideId"),
    (0, role_decorator_1.Roles)(role_enum_1.Role.Admin, role_enum_1.Role.SuperAdmin),
    (0, swagger_1.ApiOperation)({
        summary: 'Process payment refund',
        description: 'Initiate a refund for a specific ride payment. Requires Admin or SuperAdmin role.'
    }),
    (0, swagger_1.ApiParam)({
        name: 'rideId',
        type: String,
        description: 'MongoDB ObjectId of the ride to process refund for'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Refund processed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - Refund cannot be processed' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Ride not found' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error - Payment gateway issue' }),
    __param(0, (0, common_1.Param)('rideId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "processRefund", null);
__decorate([
    (0, common_1.Post)("pay_driver/:driverId"),
    (0, role_decorator_1.Roles)(role_enum_1.Role.Admin, role_enum_1.Role.SuperAdmin),
    (0, swagger_1.ApiOperation)({
        summary: 'Pay driver earnings',
        description: 'Initiates a payout to a driver for their completed rides. Requires Admin or SuperAdmin role.'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Driver paid successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - Payment cannot be processed' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Driver not found' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error - Payment gateway issue' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "payDriver", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(auth_guards_1.AuthGuards, role_guards_1.RoleGuards),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiTags)('Admin Management'),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map