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
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const user_service_1 = require("./user.service");
const sign_up_user_dto_1 = require("./dto/sign_up.user.dto");
const mongoose_1 = require("mongoose");
const otp_verification_1 = require("./dto/otp.verification");
const login_dto_1 = require("./dto/login.dto");
const file_upload_interceptor_1 = require("../../comman/inerceptors/file-upload.interceptor");
const swagger_1 = require("@nestjs/swagger");
let UserController = class UserController {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
    signUpUser(signUpDto) {
        return this.userService.signUp(signUpDto);
    }
    async sendOtp(id) {
        const userId = new mongoose_1.default.Types.ObjectId(id);
        return this.userService.sendUserVerificationOtp(userId);
    }
    async otpVerification(dto, id) {
        const userId = new mongoose_1.default.Types.ObjectId(id);
        return this.userService.userVerifiedUsingOtp(userId, dto.otp);
    }
    async login(logindto) {
        return this.userService.login(logindto);
    }
    uploadProfilePic(request, profilePicFile, userId) {
        return this.userService.uploadProfilePic(userId, profilePicFile);
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Post)("sign-up"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sign_up_user_dto_1.SignUpDto]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "signUpUser", null);
__decorate([
    (0, common_1.Post)('sendUserVerificationOtp'),
    __param(0, (0, common_1.Query)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "sendOtp", null);
__decorate([
    (0, common_1.Post)('otpVerification'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [otp_verification_1.VerifyOtpDto, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "otpVerification", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "login", null);
__decorate([
    (0, common_1.Post)("upload-profile"),
    (0, common_1.UseInterceptors)((0, file_upload_interceptor_1.UploadInterceptor)()),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Query)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Request, Object, String]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "uploadProfilePic", null);
exports.UserController = UserController = __decorate([
    (0, common_1.Controller)('user'),
    __metadata("design:paramtypes", [user_service_1.UserService])
], UserController);
//# sourceMappingURL=user.controller.js.map