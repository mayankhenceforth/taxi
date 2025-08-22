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
exports.TemporaryRideSchema = exports.TemporaryRide = exports.RideSchema = exports.Ride = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("./user.schema");
let Ride = class Ride {
    bookedBy;
    driver;
    vehicleType;
    sentToRadius;
    distance;
    baseFare;
    gstAmount;
    platformFee;
    surgeMultiplier;
    surgeCharge;
    nightCharge;
    tollFee;
    parkingFee;
    waitingCharge;
    cancellationFee;
    bonusAmount;
    referralDiscount;
    promoDiscount;
    promoCode;
    subTotal;
    TotalFare;
    driverEarnings;
    platformEarnings;
    fareBreakdown;
    status;
    paymentStatus;
    refundStatus;
    refundAmount;
    refundPercentage;
    refundReason;
    pickupLocation;
    dropoffLocation;
    otp;
    cancelReason;
    cancelledBy;
    invoiceUrl;
    paymentIntentId;
    checkoutSessionId;
    completedAt;
    startedAt;
    acceptedAt;
    cancelledAt;
    terminatedAt;
    paidAt;
    refundedAt;
    createdAt;
    updatedAt;
};
exports.Ride = Ride;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: user_schema_1.User.name }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Ride.prototype, "bookedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: user_schema_1.User.name }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Ride.prototype, "driver", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['bike', 'car'], required: true }),
    __metadata("design:type", String)
], Ride.prototype, "vehicleType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true, default: 5 }),
    __metadata("design:type", Number)
], Ride.prototype, "sentToRadius", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], Ride.prototype, "distance", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], Ride.prototype, "baseFare", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Ride.prototype, "gstAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Ride.prototype, "platformFee", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Ride.prototype, "surgeMultiplier", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Ride.prototype, "surgeCharge", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Ride.prototype, "nightCharge", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Ride.prototype, "tollFee", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Ride.prototype, "parkingFee", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Ride.prototype, "waitingCharge", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Ride.prototype, "cancellationFee", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Ride.prototype, "bonusAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Ride.prototype, "referralDiscount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Ride.prototype, "promoDiscount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Ride.prototype, "promoCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], Ride.prototype, "subTotal", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], Ride.prototype, "TotalFare", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], Ride.prototype, "driverEarnings", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], Ride.prototype, "platformEarnings", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: {
            baseFare: Number,
            gstAmount: Number,
            platformFee: Number,
            surgeCharge: Number,
            nightCharge: Number,
            tollFee: Number,
            parkingFee: Number,
            waitingCharge: Number,
            bonusAmount: Number,
            referralDiscount: Number,
            promoDiscount: Number,
            subTotal: Number,
            totalFare: Number
        }, default: {} }),
    __metadata("design:type", Object)
], Ride.prototype, "fareBreakdown", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: String, enum: ['processing', 'accepted', 'started', 'completed', 'cancelled', 'terminated'], default: 'processing' }),
    __metadata("design:type", String)
], Ride.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['paid', 'unpaid', 'refunded', 'partially_refunded'], default: 'unpaid' }),
    __metadata("design:type", String)
], Ride.prototype, "paymentStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['none', 'requested', 'processed', 'failed'], default: 'none' }),
    __metadata("design:type", String)
], Ride.prototype, "refundStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Ride.prototype, "refundAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Ride.prototype, "refundPercentage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: false }),
    __metadata("design:type", String)
], Ride.prototype, "refundReason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: [0, 0] } }),
    __metadata("design:type", Object)
], Ride.prototype, "pickupLocation", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: [0, 0] } }),
    __metadata("design:type", Object)
], Ride.prototype, "dropoffLocation", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Number)
], Ride.prototype, "otp", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Ride.prototype, "cancelReason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, enum: ['User', 'Driver'] }),
    __metadata("design:type", String)
], Ride.prototype, "cancelledBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Ride.prototype, "invoiceUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Ride.prototype, "paymentIntentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Ride.prototype, "checkoutSessionId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Ride.prototype, "completedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Ride.prototype, "startedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Ride.prototype, "acceptedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Ride.prototype, "cancelledAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Ride.prototype, "terminatedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Ride.prototype, "paidAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Ride.prototype, "refundedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Ride.prototype, "createdAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Ride.prototype, "updatedAt", void 0);
exports.Ride = Ride = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true
    })
], Ride);
exports.RideSchema = mongoose_1.SchemaFactory.createForClass(Ride);
exports.RideSchema.index({ pickupLocation: '2dsphere' });
exports.RideSchema.index({ dropoffLocation: '2dsphere' });
let TemporaryRide = class TemporaryRide {
    bookedBy;
    vehicleType;
    pickupLocation;
    dropoffLocation;
    distance;
    baseFare;
    estimatedGst;
    estimatedPlatformFee;
    surgeMultiplier;
    fare;
    status;
    eligibleDrivers;
    createdAt;
};
exports.TemporaryRide = TemporaryRide;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: user_schema_1.User.name }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], TemporaryRide.prototype, "bookedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['bike', 'car'], required: true }),
    __metadata("design:type", String)
], TemporaryRide.prototype, "vehicleType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: [0, 0] } }),
    __metadata("design:type", Object)
], TemporaryRide.prototype, "pickupLocation", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: [0, 0] } }),
    __metadata("design:type", Object)
], TemporaryRide.prototype, "dropoffLocation", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number }),
    __metadata("design:type", Number)
], TemporaryRide.prototype, "distance", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], TemporaryRide.prototype, "baseFare", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], TemporaryRide.prototype, "estimatedGst", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], TemporaryRide.prototype, "estimatedPlatformFee", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 1 }),
    __metadata("design:type", Number)
], TemporaryRide.prototype, "surgeMultiplier", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], TemporaryRide.prototype, "fare", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: String, enum: ['processing', 'accepted', 'started', 'completed', 'cancelled', 'terminated'], default: 'processing' }),
    __metadata("design:type", String)
], TemporaryRide.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [mongoose_2.Types.ObjectId], ref: user_schema_1.User.name, default: [] }),
    __metadata("design:type", Array)
], TemporaryRide.prototype, "eligibleDrivers", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now, index: { expires: 86400 } }),
    __metadata("design:type", Date)
], TemporaryRide.prototype, "createdAt", void 0);
exports.TemporaryRide = TemporaryRide = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true
    })
], TemporaryRide);
exports.TemporaryRideSchema = mongoose_1.SchemaFactory.createForClass(TemporaryRide);
//# sourceMappingURL=ride.schema.js.map