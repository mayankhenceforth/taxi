import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { DriverPayout } from "./payout.schema";
import { DriverEarnings } from "./driver-earnings.schema";

export type UserDocument = User & Document;
export type VehicleDetailsDocument = VehicleDetails & Document;
export type DriverLicenseDocument = DriverLicense & Document;

@Schema()
export class DriverLicense {
    @Prop({
        required: true,
        trim: true,
        type: String,
        match: [/^[A-Z0-9-]+$/, "Invalid license number format"],
    })
    licenseNumber: string;

    @Prop({
        required: true,
        type: Date,
    })
    issueDate: Date;

    @Prop({
        required: true,
        type: Date,
    })
    expiryDate: Date;

    @Prop({
        required: true,
        trim: true,
        type: String,
    })
    issuingAuthority: string;

    @Prop({
        required: true,
        default: false,
    })
    isVerified: boolean;
}

export const DriverLicenseSchema = SchemaFactory.createForClass(DriverLicense);

@Schema()
export class VehicleDetails {
    @Prop({
        required: true,
        unique: true,
        trim: true,
        type: String,
        match: [/^[A-Za-z0-9-]+$/, "Invalid number plate format"], // Allow both cases
        uppercase: true, // Still convert to uppercase for consistency
    })
    numberPlate: string;

    @Prop({
        required: true,
        trim: true,
        lowercase: true,
        type: String,
        enum: ["car", "bike"],
    })
    type: string;

    @Prop({
        required: true,
        trim: true,
        lowercase: true,
        type: String,
    })
    model: string;
}

export const vehicleDetailsSchema = SchemaFactory.createForClass(VehicleDetails);

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop()
    profilePic: string;

    @Prop({
        required: false,
        unique: true,
        trim: true,
        lowercase: true,
    })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true, unique: true })
    contactNumber: string;

    @Prop()
    refreshToken: string;

    @Prop()
    otp?: number;

    @Prop({
        enum: ["forgot-password", "registration", "login"],
    })
    otpType: string;

    @Prop()
    otpExpiresAt?: Date;

    @Prop({ required: true, default: false })
    isContactNumberVerified: boolean;

    @Prop({ required: true, default: "user" })
    role: "admin" | "user" | "super-admin" | "driver";

    @Prop({
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
    })
    location: {
        type: string;
        coordinates: number[];
    };

    @Prop({ type: Types.ObjectId, ref: VehicleDetails.name, required: function () { return this.role === "driver"; }, })
    vehicleDetails?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: DriverLicense.name, required: function () { return this.role === "driver"; }, })
    driverLicense?: Types.ObjectId;

    @Prop({ required: true, default: false })
    isVerified: boolean;

    @Prop({ type: [{ type: Types.ObjectId, ref: DriverPayout.name }] })
    payoutAccounts?: Types.ObjectId[];

    @Prop({ type: Types.ObjectId, ref: DriverEarnings.name })
    earnings?: Types.ObjectId;
    @Prop({
        default: 0,
        required: function () { return this.role === "driver"; },
    })
    rating?: number;

    @Prop({ enum: [true, false] })
    status: true
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ location: "2dsphere" });
UserSchema.index({ email: 1, contactNumber: 1 });

export type PendingUserDocument = PendingUser & Document
@Schema({ timestamps: true })
export class PendingUser {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, unique: true })
    contactNumber: string;

    @Prop({
        required: false,
        unique: false,
        trim: true,
        lowercase: true,
    })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ default: "" })
    profilePic: string;

    @Prop({ required: true, default: "user" })
    role: "admin" | "user" | "super-admin" | "driver";

    @Prop({ required: true, default: false })
    isVerified: boolean;

    @Prop()
    refreshToken: string;

    @Prop()
    otp?: Number;

    @Prop()
    otpExpiresAt?: Date;

    @Prop({ type: vehicleDetailsSchema })
    vehicleDetails?: VehicleDetails;

    @Prop({
        type: DriverLicenseSchema,
        required: function () { return this.role === "driver"; },
    })
    driverLicense?: DriverLicense;

    @Prop({
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
    })
    location: {
        type: string;
        coordinates: number[];
    };

    @Prop({
        default: Date.now,
        index: { expires: "1h" },
    })
    createdAt: Date;
}

export const PendingUserSchema = SchemaFactory.createForClass(PendingUser)
