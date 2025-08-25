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
const api_response_1 = require("../../comman/helpers/api-response");
const cloudinary_service_1 = require("../../comman/cloudinary/cloudinary.service");
const sms_service_1 = require("../../comman/sms/sms.service");
let UserService = class UserService {
    userModel;
    pendingUserModel;
    driverLicenseModel;
    vehicleDetailsModel;
    tokenService;
    cloudinaryService;
    smsService;
    constructor(userModel, pendingUserModel, driverLicenseModel, vehicleDetailsModel, tokenService, cloudinaryService, smsService) {
        this.userModel = userModel;
        this.pendingUserModel = pendingUserModel;
        this.driverLicenseModel = driverLicenseModel;
        this.vehicleDetailsModel = vehicleDetailsModel;
        this.tokenService = tokenService;
        this.cloudinaryService = cloudinaryService;
        this.smsService = smsService;
    }
    async getPendingUser(contactNumber) {
        return this.pendingUserModel.findOne({ contactNumber }).exec();
    }
    async signUp(signUp) {
        console.log(signUp);
        const fullContactNumber = signUp.countryCode + signUp.contactNumber;
        const existingUser = await this.userModel.findOne({ contactNumber: fullContactNumber }).exec();
        const pendingUser = await this.getPendingUser(fullContactNumber);
        if (existingUser || pendingUser) {
            throw new common_1.BadRequestException("User already exists");
        }
        const hashedPassword = await bcrypt.hash(signUp.password, 10);
        const userData = {
            name: signUp.name,
            contactNumber: fullContactNumber,
            password: hashedPassword,
            role: signUp.role,
            email: signUp.email,
            isContactNumberVerified: false,
            isVerified: false,
            profilePic: signUp.profilePic,
        };
        if (signUp.role === 'driver') {
            if (!signUp.driverLicenseNumber)
                throw new common_1.BadRequestException('Driver license number is required');
            if (!signUp.licenseIssueDate)
                throw new common_1.BadRequestException('License issue date is required');
            if (!signUp.licenseExpiryDate)
                throw new common_1.BadRequestException('License expiry date is required');
            if (!signUp.issuingAuthority)
                throw new common_1.BadRequestException('Issuing authority is required');
            if (!signUp.vehicleNumberPlate)
                throw new common_1.BadRequestException('Vehicle number plate is required');
            if (!signUp.vehicleType)
                throw new common_1.BadRequestException('Vehicle type is required');
            if (!signUp.vehicleModel)
                throw new common_1.BadRequestException('Vehicle model is required');
            if (!signUp.coordinates)
                throw new common_1.BadRequestException('Location coordinates are required');
            const uppercaseNumberPlate = signUp.vehicleNumberPlate.toUpperCase();
            const existingLicense = await this.driverLicenseModel.findOne({ licenseNumber: signUp.driverLicenseNumber }).exec();
            if (existingLicense) {
                throw new common_1.BadRequestException('Driver license number already exists');
            }
            const existingVehicle = await this.vehicleDetailsModel.findOne({ numberPlate: uppercaseNumberPlate }).exec();
            if (existingVehicle) {
                throw new common_1.BadRequestException('Vehicle number plate already exists');
            }
            userData.driverLicense = {
                licenseNumber: signUp.driverLicenseNumber,
                issueDate: new Date(signUp.licenseIssueDate),
                expiryDate: new Date(signUp.licenseExpiryDate),
                issuingAuthority: signUp.issuingAuthority,
                isVerified: false,
            };
            userData.vehicleDetails = {
                numberPlate: uppercaseNumberPlate,
                type: signUp.vehicleType,
                model: signUp.vehicleModel,
            };
            userData.location = {
                type: 'Point',
                coordinates: signUp.coordinates,
            };
        }
        const newUser = await this.pendingUserModel.create(userData);
        const accessToken = await this.tokenService.generateAccessToken(newUser._id);
        const refreshToken = await this.tokenService.generateRefreshToken(newUser._id);
        newUser.refreshToken = refreshToken;
        await newUser.save();
        await this.sendUserVerificationOtp(newUser._id);
        const { password, ...userWithoutPassword } = newUser.toObject();
        return {
            message: "User created successfully",
            data: userWithoutPassword,
            accessToken,
            refreshToken,
        };
    }
    async sendUserVerificationOtp(userId) {
        const pendingUser = await this.pendingUserModel.findById(userId).exec();
        if (!pendingUser) {
            throw new common_1.BadRequestException('User not found');
        }
        const otp = crypto.randomInt(100000, 999999);
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
        pendingUser.otp = otp;
        pendingUser.otpExpiresAt = otpExpiresAt;
        await pendingUser.save();
        await this.smsService.sendVerificationOtpSms(otp);
        return {
            message: 'OTP sent successfully',
            otpSentTo: pendingUser.contactNumber,
        };
    }
    async userVerifiedUsingOtp(userId, otp) {
        console.log("user vefification");
        const pendingUser = await this.pendingUserModel.findById(userId).exec();
        if (!pendingUser)
            throw new common_1.BadRequestException('Pending user not found');
        if (pendingUser.otp !== otp)
            throw new common_1.BadRequestException('Invalid OTP');
        if (pendingUser.otpExpiresAt && pendingUser.otpExpiresAt < new Date())
            throw new common_1.BadRequestException('OTP expired');
        const userData = {
            name: pendingUser.name,
            contactNumber: pendingUser.contactNumber,
            password: pendingUser.password,
            role: pendingUser.role,
            refreshToken: pendingUser.refreshToken,
            isVerified: true,
            profilePic: pendingUser.profilePic,
            isContactNumberVerified: true,
            email: pendingUser.email,
            location: pendingUser.location,
        };
        if (pendingUser.role === 'driver' && pendingUser.driverLicense && pendingUser.vehicleDetails) {
            console.log("vehicale", pendingUser.vehicleDetails.model);
            console.log("License", pendingUser.driverLicense.licenseNumber);
            const [existingLicense, existingVehicle] = await Promise.all([
                this.driverLicenseModel.findOne({ licenseNumber: pendingUser.driverLicense.licenseNumber }),
                this.vehicleDetailsModel.findOne({ numberPlate: pendingUser.vehicleDetails.numberPlate.toUpperCase() }),
            ]);
            if (existingLicense) {
                userData.driverLicense = existingLicense._id;
            }
            else {
                const driverLicenseDoc = await this.driverLicenseModel.create({
                    licenseNumber: pendingUser.driverLicense.licenseNumber,
                    issueDate: pendingUser.driverLicense.issueDate,
                    expiryDate: pendingUser.driverLicense.expiryDate,
                    issuingAuthority: pendingUser.driverLicense.issuingAuthority,
                    isVerified: false,
                });
                userData.driverLicense = driverLicenseDoc._id;
            }
            if (existingVehicle) {
                userData.vehicleDetails = existingVehicle._id;
            }
            else {
                console.log("vehicale", pendingUser.vehicleDetails.model);
                const vehicleDetailsDoc = await this.vehicleDetailsModel.create({
                    numberPlate: pendingUser.vehicleDetails.numberPlate.toUpperCase(),
                    type: pendingUser.vehicleDetails.type,
                    model: pendingUser.vehicleDetails.model,
                });
                userData.vehicleDetails = vehicleDetailsDoc._id;
            }
        }
        const newUser = await this.userModel.create(userData);
        await this.pendingUserModel.findByIdAndDelete(userId).exec();
        const { password, ...userWithoutPassword } = newUser.toObject();
        return {
            message: 'User verified successfully',
            data: userWithoutPassword,
        };
    }
    async login(loginDto) {
        const { contactNumber, password } = loginDto;
        if (!contactNumber || !password) {
            throw new common_1.NotAcceptableException("Please enter contact Number and password");
        }
        const user = await this.userModel.findOne({ contactNumber })
            .populate('driverLicense')
            .populate('vehicleDetails')
            .exec();
        if (!user)
            throw new common_1.NotAcceptableException("User not found");
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid)
            throw new common_1.NotAcceptableException("Invalid password");
        const accessToken = await this.tokenService.generateAccessToken(user._id);
        const refreshToken = await this.tokenService.generateRefreshToken(user._id);
        user.refreshToken = refreshToken;
        await user.save();
        const { password: _, ...userWithoutPassword } = user.toObject();
        return {
            message: "User login successfully",
            data: userWithoutPassword,
            accessToken,
            refreshToken,
        };
    }
    async logout(userId) {
        const user = await this.userModel.findById(userId).exec();
        if (!user)
            throw new common_1.UnauthorizedException("User not found");
        user.refreshToken = '';
        await user.save();
        return new api_response_1.default(true, 'Ride created successfully!', common_1.HttpStatus.OK);
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
    __param(2, (0, mongoose_1.InjectModel)(user_schema_1.DriverLicense.name)),
    __param(3, (0, mongoose_1.InjectModel)(user_schema_1.VehicleDetails.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        token_service_1.TokenService,
        cloudinary_service_1.CloudinaryService,
        sms_service_1.SmsService])
], UserService);
//# sourceMappingURL=user.service.js.map