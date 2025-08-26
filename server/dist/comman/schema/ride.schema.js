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
const payment_schema_1 = require("./payment.schema");
let Ride = class Ride {
    bookedBy;
    driver;
    vehicleType;
    sentToRadius;
    distance;
    TotalFare;
    driverEarnings;
    platformEarnings;
    fareBreakdown;
    status;
    paymentStatus;
    checkoutSessionId;
    paymentId;
    pickupLocation;
    dropoffLocation;
    otp;
    cancelReason;
    cancelledBy;
    invoiceUrl;
    ratingId;
    completedAt;
    startedAt;
    acceptedAt;
    arrivedAt;
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
    (0, mongoose_1.Prop)({
        type: {
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
        },
        default: {}
    }),
    __metadata("design:type", Object)
], Ride.prototype, "fareBreakdown", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        type: String,
        enum: ['processing', 'accepted', 'arrived', 'started', 'completed', 'cancelled', 'terminated'],
        default: 'processing'
    }),
    __metadata("design:type", String)
], Ride.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: ['unpaid', 'paid', 'refunded', 'partially_refunded', "pending"],
        default: 'pending'
    }),
    __metadata("design:type", String)
], Ride.prototype, "paymentStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Ride.prototype, "checkoutSessionId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: 'Payment' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Ride.prototype, "paymentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: [0, 0] } }),
    __metadata("design:type", Object)
], Ride.prototype, "pickupLocation", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: [0, 0] } }),
    __metadata("design:type", Object)
], Ride.prototype, "dropoffLocation", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Ride.prototype, "otp", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Ride.prototype, "cancelReason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['User', 'Driver', 'System'] }),
    __metadata("design:type", String)
], Ride.prototype, "cancelledBy", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Ride.prototype, "invoiceUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: 'RideRating' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Ride.prototype, "ratingId", void 0);
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
], Ride.prototype, "arrivedAt", void 0);
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
    driver;
    vehicleType;
    sentToRadius;
    distance;
    TotalFare;
    driverEarnings;
    platformEarnings;
    fareBreakdown;
    status;
    paymentStatus;
    paymentId;
    pickupLocation;
    dropoffLocation;
    otp;
    eligibleDrivers;
    createdAt;
};
exports.TemporaryRide = TemporaryRide;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: user_schema_1.User.name }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], TemporaryRide.prototype, "bookedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: user_schema_1.User.name }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], TemporaryRide.prototype, "driver", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['bike', 'car'], required: true }),
    __metadata("design:type", String)
], TemporaryRide.prototype, "vehicleType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true, default: 5 }),
    __metadata("design:type", Number)
], TemporaryRide.prototype, "sentToRadius", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], TemporaryRide.prototype, "distance", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], TemporaryRide.prototype, "TotalFare", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], TemporaryRide.prototype, "driverEarnings", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true }),
    __metadata("design:type", Number)
], TemporaryRide.prototype, "platformEarnings", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
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
        },
        default: {}
    }),
    __metadata("design:type", Object)
], TemporaryRide.prototype, "fareBreakdown", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        type: String,
        enum: ['processing', 'accepted', 'arrived', 'started', 'completed', 'cancelled', 'terminated'],
        default: 'processing'
    }),
    __metadata("design:type", String)
], TemporaryRide.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: ['unpaid', 'paid', 'refunded', 'partially_refunded'],
        default: 'unpaid'
    }),
    __metadata("design:type", String)
], TemporaryRide.prototype, "paymentStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: payment_schema_1.Payment.name }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], TemporaryRide.prototype, "paymentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: [0, 0] } }),
    __metadata("design:type", Object)
], TemporaryRide.prototype, "pickupLocation", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: [0, 0] } }),
    __metadata("design:type", Object)
], TemporaryRide.prototype, "dropoffLocation", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], TemporaryRide.prototype, "otp", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [mongoose_2.Types.ObjectId], ref: user_schema_1.User.name, default: [] }),
    __metadata("design:type", Array)
], TemporaryRide.prototype, "eligibleDrivers", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now, index: { expires: 900 } }),
    __metadata("design:type", Date)
], TemporaryRide.prototype, "createdAt", void 0);
exports.TemporaryRide = TemporaryRide = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true
    })
], TemporaryRide);
exports.TemporaryRideSchema = mongoose_1.SchemaFactory.createForClass(TemporaryRide);
exports.TemporaryRideSchema.index({ pickupLocation: '2dsphere' });
exports.TemporaryRideSchema.index({ dropoffLocation: '2dsphere' });
//# sourceMappingURL=ride.schema.js.map