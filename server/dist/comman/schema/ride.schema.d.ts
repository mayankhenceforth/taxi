import mongoose, { Types, Document } from 'mongoose';
export type RideDocument = Ride & Document;
export declare class Ride {
    bookedBy: Types.ObjectId;
    driver?: Types.ObjectId;
    vehicleType: 'bike' | 'car';
    sentToRadius: number;
    distance: number;
    TotalFare: number;
    driverEarnings: number;
    platformEarnings: number;
    fareBreakdown: {
        baseFare: number;
        gstAmount: number;
        platformFee: number;
        surgeCharge: number;
        nightCharge: number;
        tollFee: number;
        parkingFee: number;
        waitingCharge: number;
        bonusAmount: number;
        referralDiscount: number;
        promoDiscount: number;
        subTotal: number;
        totalFare: number;
    };
    status: string;
    paymentStatus: 'unpaid' | 'paid' | 'refunded' | 'partially_refunded';
    checkoutSessionId?: string;
    paymentId?: Types.ObjectId;
    pickupLocation: {
        type: string;
        coordinates: number[];
    };
    dropoffLocation: {
        type: string;
        coordinates: number[];
    };
    otp?: number;
    cancelReason?: string;
    cancelledBy?: 'User' | 'Driver' | 'System';
    invoiceUrl?: string;
    ratingId?: Types.ObjectId;
    completedAt?: Date;
    startedAt?: Date;
    acceptedAt?: Date;
    arrivedAt?: Date;
    cancelledAt?: Date;
    terminatedAt?: Date;
    paidAt?: Date;
    refundedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const RideSchema: mongoose.Schema<Ride, mongoose.Model<Ride, any, any, any, mongoose.Document<unknown, any, Ride, any, {}> & Ride & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, Ride, mongoose.Document<unknown, {}, mongoose.FlatRecord<Ride>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<Ride> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export type TemporaryRideDocument = TemporaryRide & Document;
export declare class TemporaryRide {
    bookedBy: Types.ObjectId;
    driver?: Types.ObjectId;
    vehicleType: 'bike' | 'car';
    sentToRadius: number;
    distance: number;
    TotalFare: number;
    driverEarnings: number;
    platformEarnings: number;
    fareBreakdown: {
        baseFare: number;
        gstAmount: number;
        platformFee: number;
        surgeCharge: number;
        nightCharge: number;
        tollFee: number;
        parkingFee: number;
        waitingCharge: number;
        bonusAmount: number;
        referralDiscount: number;
        promoDiscount: number;
        subTotal: number;
        totalFare: number;
    };
    status: string;
    paymentStatus: 'unpaid' | 'paid' | 'refunded' | 'partially_refunded';
    paymentId?: Types.ObjectId;
    pickupLocation: {
        type: string;
        coordinates: number[];
    };
    dropoffLocation: {
        type: string;
        coordinates: number[];
    };
    otp?: number;
    eligibleDrivers: Types.ObjectId[];
    createdAt: Date;
}
export declare const TemporaryRideSchema: mongoose.Schema<TemporaryRide, mongoose.Model<TemporaryRide, any, any, any, mongoose.Document<unknown, any, TemporaryRide, any, {}> & TemporaryRide & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, TemporaryRide, mongoose.Document<unknown, {}, mongoose.FlatRecord<TemporaryRide>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<TemporaryRide> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
