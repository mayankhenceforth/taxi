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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PendingUserSchema = exports.PendingUser = exports.UserSchema = exports.User = exports.vehicleDetailsSchema = exports.VehicleDetails = exports.DriverLicenseSchema = exports.DriverLicense = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const payout_schema_1 = require("./payout.schema");
const driver_earnings_schema_1 = require("./driver-earnings.schema");
let DriverLicense = class DriverLicense {
    licenseNumber;
    issueDate;
    expiryDate;
    issuingAuthority;
    isVerified;
};
exports.DriverLicense = DriverLicense;
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        trim: true,
        type: String,
        match: [/^[A-Z0-9-]+$/, "Invalid license number format"],
    }),
    __metadata("design:type", String)
], DriverLicense.prototype, "licenseNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        type: Date,
    }),
    __metadata("design:type", Date)
], DriverLicense.prototype, "issueDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        type: Date,
    }),
    __metadata("design:type", Date)
], DriverLicense.prototype, "expiryDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        trim: true,
        type: String,
    }),
    __metadata("design:type", String)
], DriverLicense.prototype, "issuingAuthority", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        default: false,
    }),
    __metadata("design:type", Boolean)
], DriverLicense.prototype, "isVerified", void 0);
exports.DriverLicense = DriverLicense = __decorate([
    (0, mongoose_1.Schema)()
], DriverLicense);
exports.DriverLicenseSchema = mongoose_1.SchemaFactory.createForClass(DriverLicense);
let VehicleDetails = class VehicleDetails {
    numberPlate;
    type;
    model;
};
exports.VehicleDetails = VehicleDetails;
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        unique: true,
        trim: true,
        type: String,
        match: [/^[A-Za-z0-9-]+$/, "Invalid number plate format"],
        uppercase: true,
    }),
    __metadata("design:type", String)
], VehicleDetails.prototype, "numberPlate", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        trim: true,
        lowercase: true,
        type: String,
        enum: ["car", "bike"],
    }),
    __metadata("design:type", String)
], VehicleDetails.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        trim: true,
        lowercase: true,
        type: String,
    }),
    __metadata("design:type", String)
], VehicleDetails.prototype, "model", void 0);
exports.VehicleDetails = VehicleDetails = __decorate([
    (0, mongoose_1.Schema)()
], VehicleDetails);
exports.vehicleDetailsSchema = mongoose_1.SchemaFactory.createForClass(VehicleDetails);
let User = class User {
    name;
    profilePic;
    email;
    password;
    contactNumber;
    refreshToken;
    otp;
    otpType;
    otpExpiresAt;
    isContactNumberVerified;
    role;
    location;
    vehicleDetails;
    driverLicense;
    isVerified;
    payoutAccounts;
    earnings;
    rating;
    status;
};
exports.User = User;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], User.prototype, "profilePic", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: false,
        unique: true,
        trim: true,
        lowercase: true,
    }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], User.prototype, "contactNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], User.prototype, "refreshToken", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], User.prototype, "otp", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        enum: ["forgot-password", "registration", "login"],
    }),
    __metadata("design:type", String)
], User.prototype, "otpType", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], User.prototype, "otpExpiresAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isContactNumberVerified", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: "user" }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number],
            required: true,
            default: [0, 0],
        },
    }),
    __metadata("design:type", Object)
], User.prototype, "location", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: exports.vehicleDetailsSchema }),
    __metadata("design:type", VehicleDetails)
], User.prototype, "vehicleDetails", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: exports.DriverLicenseSchema,
        required: function () { return this.role === "driver"; },
    }),
    __metadata("design:type", DriverLicense)
], User.prototype, "driverLicense", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isVerified", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: mongoose_2.Types.ObjectId, ref: payout_schema_1.DriverPayout.name }] }),
    __metadata("design:type", Array)
], User.prototype, "payoutAccounts", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: driver_earnings_schema_1.DriverEarnings.name }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], User.prototype, "earnings", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        default: 0,
        required: function () { return this.role === "driver"; },
    }),
    __metadata("design:type", Number)
], User.prototype, "rating", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: [true, false] }),
    __metadata("design:type", Boolean)
], User.prototype, "status", void 0);
exports.User = User = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], User);
exports.UserSchema = mongoose_1.SchemaFactory.createForClass(User);
exports.UserSchema.index({ location: "2dsphere" });
exports.UserSchema.index({ email: 1, contactNumber: 1 });
let PendingUser = class PendingUser {
    name;
    contactNumber;
    email;
    password;
    profilePic;
    role;
    isVerified;
    refreshToken;
    otp;
    otpExpiresAt;
    vehicleDetails;
    driverLicense;
    location;
    createdAt;
};
exports.PendingUser = PendingUser;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], PendingUser.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], PendingUser.prototype, "contactNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: false,
        unique: false,
        trim: true,
        lowercase: true,
    }),
    __metadata("design:type", String)
], PendingUser.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], PendingUser.prototype, "password", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: "" }),
    __metadata("design:type", String)
], PendingUser.prototype, "profilePic", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: "user" }),
    __metadata("design:type", String)
], PendingUser.prototype, "role", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: false }),
    __metadata("design:type", Boolean)
], PendingUser.prototype, "isVerified", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], PendingUser.prototype, "refreshToken", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], PendingUser.prototype, "otp", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], PendingUser.prototype, "otpExpiresAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: exports.vehicleDetailsSchema }),
    __metadata("design:type", VehicleDetails)
], PendingUser.prototype, "vehicleDetails", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: exports.DriverLicenseSchema,
        required: function () { return this.role === "driver"; },
    }),
    __metadata("design:type", DriverLicense)
], PendingUser.prototype, "driverLicense", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number],
            required: true,
            default: [0, 0],
        },
    }),
    __metadata("design:type", Object)
], PendingUser.prototype, "location", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        default: Date.now,
        index: { expires: "1h" },
    }),
    __metadata("design:type", Date)
], PendingUser.prototype, "createdAt", void 0);
exports.PendingUser = PendingUser = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], PendingUser);
exports.PendingUserSchema = mongoose_1.SchemaFactory.createForClass(PendingUser);
//# sourceMappingURL=user.schema.js.map