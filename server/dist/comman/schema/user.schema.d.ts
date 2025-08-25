import { Types } from "mongoose";
export type UserDocument = User & Document;
export type VehicleDetailsDocument = VehicleDetails & Document;
export type DriverLicenseDocument = DriverLicense & Document;
export declare class DriverLicense {
    licenseNumber: string;
    issueDate: Date;
    expiryDate: Date;
    issuingAuthority: string;
    isVerified: boolean;
}
export declare const DriverLicenseSchema: import("mongoose").Schema<DriverLicense, import("mongoose").Model<DriverLicense, any, any, any, import("mongoose").Document<unknown, any, DriverLicense, any, {}> & DriverLicense & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, DriverLicense, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<DriverLicense>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<DriverLicense> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare class VehicleDetails {
    numberPlate: string;
    type: string;
    model: string;
}
export declare const vehicleDetailsSchema: import("mongoose").Schema<VehicleDetails, import("mongoose").Model<VehicleDetails, any, any, any, import("mongoose").Document<unknown, any, VehicleDetails, any, {}> & VehicleDetails & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, VehicleDetails, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<VehicleDetails>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<VehicleDetails> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare class User {
    name: string;
    profilePic: string;
    email: string;
    password: string;
    contactNumber: string;
    refreshToken: string;
    otp?: number;
    otpType: string;
    otpExpiresAt?: Date;
    isContactNumberVerified: boolean;
    role: "admin" | "user" | "super-admin" | "driver";
    location: {
        type: string;
        coordinates: number[];
    };
    vehicleDetails?: Types.ObjectId;
    driverLicense?: Types.ObjectId;
    isVerified: boolean;
    payoutAccounts?: Types.ObjectId[];
    earnings?: Types.ObjectId;
    rating?: number;
    status: true;
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, import("mongoose").Document<unknown, any, User, any, {}> & User & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<User>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<User> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export type PendingUserDocument = PendingUser & Document;
export declare class PendingUser {
    name: string;
    contactNumber: string;
    email: string;
    password: string;
    profilePic: string;
    role: "admin" | "user" | "super-admin" | "driver";
    isVerified: boolean;
    refreshToken: string;
    otp?: Number;
    otpExpiresAt?: Date;
    vehicleDetails?: VehicleDetails;
    driverLicense?: DriverLicense;
    location: {
        type: string;
        coordinates: number[];
    };
    createdAt: Date;
}
export declare const PendingUserSchema: import("mongoose").Schema<PendingUser, import("mongoose").Model<PendingUser, any, any, any, import("mongoose").Document<unknown, any, PendingUser, any, {}> & PendingUser & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PendingUser, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<PendingUser>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<PendingUser> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
