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
        console.log("userId:", id);
        const userId = new mongoose_1.default.Types.ObjectId(id);
        console.log("user Mogodb id:", userId);
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
    (0, swagger_1.ApiOperation)({ summary: 'Register a new user', description: 'Creates a new user account with the provided details.' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'User successfully registered.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input data.' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'User already exists.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sign_up_user_dto_1.SignUpDto]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "signUpUser", null);
__decorate([
    (0, common_1.Post)('sendUserVerificationOtp'),
    (0, swagger_1.ApiOperation)({ summary: 'Send OTP for user verification', description: 'Sends a one-time password (OTP) to the user for account verification.' }),
    (0, swagger_1.ApiQuery)({ name: 'id', type: String, description: 'User ID (MongoDB ObjectId)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OTP sent successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found.' }),
    __param(0, (0, common_1.Query)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "sendOtp", null);
__decorate([
    (0, common_1.Post)('otpVerification'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify user with OTP', description: 'Verifies the user account using the provided OTP.' }),
    (0, swagger_1.ApiQuery)({ name: 'id', type: String, description: 'User ID (MongoDB ObjectId)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User verified successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid OTP.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found.' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [otp_verification_1.VerifyOtpDto, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "otpVerification", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, swagger_1.ApiOperation)({ summary: 'User login', description: 'Authenticates a user with their credentials.' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User logged in successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid credentials.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "login", null);
__decorate([
    (0, common_1.Post)("upload-profile"),
    (0, common_1.UseInterceptors)((0, file_upload_interceptor_1.UploadInterceptor)()),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload user profile picture', description: 'Uploads a profile picture for the specified user.' }),
    (0, swagger_1.ApiQuery)({ name: 'id', type: String, description: 'User ID (MongoDB ObjectId)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile picture uploaded successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid file or user ID.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found.' }),
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
    (0, swagger_1.ApiTags)('User'),
    (0, common_1.Controller)('user'),
    __metadata("design:paramtypes", [user_service_1.UserService])
], UserController);
//# sourceMappingURL=user.controller.js.map