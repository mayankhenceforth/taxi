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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const user_schema_1 = require("../../comman/schema/user.schema");
const mongoose_2 = require("mongoose");
const bcrypt = require("bcrypt");
const token_service_1 = require("../../comman/token/token.service");
const crypto = require("crypto");
const cloudinary_service_1 = require("../../comman/cloudinary/cloudinary.service");
const sms_service_1 = require("../../comman/sms/sms.service");
let UserService = class UserService {
    userModel;
    pendingUserModel;
    tokenService;
    cloudinaryService;
    smsService;
    constructor(userModel, pendingUserModel, tokenService, cloudinaryService, smsService) {
        this.userModel = userModel;
        this.pendingUserModel = pendingUserModel;
        this.tokenService = tokenService;
        this.cloudinaryService = cloudinaryService;
        this.smsService = smsService;
    }
    async getPendingUser(contactNumber) {
        return this.pendingUserModel.findOne({ contactNumber });
    }
    async signUp(signUp) {
        const existingUser = await this.userModel.findOne({ contactNumber: signUp.contactNumber });
        const pendingUser = await this.getPendingUser(signUp.contactNumber);
        console.log(existingUser || pendingUser);
        if (existingUser || pendingUser) {
            throw new common_1.BadRequestException("User already exists");
        }
        const hashedPassword = await bcrypt.hash(signUp.password, 10);
        const newUser = await this.pendingUserModel.create({ ...signUp, password: hashedPassword });
        const accessToken = await this.tokenService.generateAccessToken(newUser._id);
        const refreshToken = await this.tokenService.generateRefreshToken(newUser._id);
        newUser.refreshToken = refreshToken;
        await newUser.save();
        await this.sendUserVerificationOtp(newUser._id);
        const { password, ...userWithoutPassword } = newUser.toObject();
        return { message: "User created successfully", data: userWithoutPassword, accessToken, refreshToken };
    }
    async sendUserVerificationOtp(userId) {
        const pendingUser = await this.pendingUserModel.findById(userId);
        if (!pendingUser) {
            throw new common_1.BadRequestException('User not found');
        }
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
        pendingUser.otp = otp;
        pendingUser.otpExpiresAt = otpExpiresAt;
        await pendingUser.save();
        await this.smsService.sendVerificationOtpSms(Number(otp));
        return { message: 'OTP sent successfully', otpSentTo: pendingUser.contactNumber };
    }
    async userVerifiedUsingOtp(userId, otp) {
        const pendingUser = await this.pendingUserModel.findById(userId);
        if (!pendingUser)
            throw new common_1.BadRequestException('Pending user not found');
        if (pendingUser.otp !== otp.toString())
            throw new common_1.BadRequestException('Invalid OTP');
        if (pendingUser.otpExpiresAt && pendingUser.otpExpiresAt < new Date())
            throw new common_1.BadRequestException('OTP expired');
        const newUser = await this.userModel.create({
            name: pendingUser.name,
            contactNumber: pendingUser.contactNumber,
            password: pendingUser.password,
            role: pendingUser.role,
            refreshToken: pendingUser.refreshToken,
            isVerified: true,
            profilePic: pendingUser.profilePic,
            vehicleDetails: pendingUser.vehicleDetails,
            location: pendingUser.location,
            isContactNumberVerified: true,
        });
        await this.pendingUserModel.findByIdAndDelete(userId);
        const { password, ...userWithoutPassword } = newUser.toObject();
        return { message: 'User verified successfully', data: userWithoutPassword };
    }
    async login(loginDto) {
        const { contactNumber, password } = loginDto;
        if (!contactNumber || !password)
            throw new common_1.NotAcceptableException("Please enter contact Number and password");
        const user = await this.userModel.findOne({ contactNumber });
        if (!user)
            throw new common_1.NotAcceptableException("User not found");
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid)
            throw new common_1.NotAcceptableException("Invalid password");
        const accessToken = await this.tokenService.generateAccessToken(user._id);
        const refreshToken = await this.tokenService.generateRefreshToken(user._id);
        user.refreshToken = refreshToken;
        await user.save();
        return { message: "User login successfully", data: user, accessToken, refreshToken };
    }
    async logout(userId) {
        await this.userModel.findByIdAndUpdate(userId, { $set: { refreshToken: '' } });
        return { message: "User logged out successfully" };
    }
    async uploadProfilePic(userid, profilePicFile) {
        if (!profilePicFile)
            throw new common_1.NotFoundException("Oops! Please check ProfilePic field");
        const existUser = await this.userModel.findById(userid);
        if (!existUser)
            throw new common_1.UnauthorizedException("User not Found");
        const cloudFile = await this.cloudinaryService.uploadFile(profilePicFile);
        if (!cloudFile)
            throw new Error('Cloudinary upload failed');
        existUser.profilePic = cloudFile.secure_url;
        await existUser.save();
        return {
            success: true,
            statusCode: 200,
            message: 'Profile picture uploaded successfully',
            data: cloudFile.secure_url,
        };
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.PendingUser.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        token_service_1.TokenService,
        cloudinary_service_1.CloudinaryService,
        sms_service_1.SmsService])
], UserService);
//# sourceMappingURL=user.service.js.map