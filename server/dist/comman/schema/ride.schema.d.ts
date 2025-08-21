import { Types, Document } from 'mongoose';
export type RideDocument = Ride & Document;
export declare class Ride {
    bookedBy: Types.ObjectId;
    driver?: Types.ObjectId;
    vehicleType: 'bike' | 'car';
    sentToRadius: number;
    distance: number;
    TotalFare: number;
    status: string;
    paymentStatus: 'unpaid' | 'paid';
    refundStatus?: 'none' | 'requested' | 'processed';
    pickupLocation: {
        type: string;
        coordinates: number[];
    };
    dropoffLocation: {
        type: string;
        coordinates: number[];
    };
    otp: number;
    cancelReason?: string;
    cancelledBy?: 'User' | 'Driver';
    invoiceUrl?: string;
    expiresAt: Date;
}
export declare const RideSchema: import("mongoose").Schema<Ride, import("mongoose").Model<Ride, any, any, any, Document<unknown, any, Ride, any, {}> & Ride & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Ride, Document<unknown, {}, import("mongoose").FlatRecord<Ride>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Ride> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export type TemporaryRideDocument = TemporaryRide & Document;
export declare class TemporaryRide {
    bookedBy: Types.ObjectId;
    vehicleType: 'bike' | 'car';
    pickupLocation: {
        type: string;
        coordinates: number[];
    };
    dropoffLocation: {
        type: string;
        coordinates: number[];
    };
    distance: number;
    fare: number;
    status: string;
    eligibleDrivers: Types.ObjectId[];
    createdAt: Date;
}
export declare const TemporaryRideSchema: import("mongoose").Schema<TemporaryRide, import("mongoose").Model<TemporaryRide, any, any, any, Document<unknown, any, TemporaryRide, any, {}> & TemporaryRide & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, TemporaryRide, Document<unknown, {}, import("mongoose").FlatRecord<TemporaryRide>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<TemporaryRide> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
