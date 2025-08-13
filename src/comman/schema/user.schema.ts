import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";


export type UserDocument = User & Document;
// export type UserModelPaginate = PaginateModel<UserDocument>;

export type VehicleDetailsDocument = VehicleDetails & Document;
@Schema()
export class VehicleDetails {

    @Prop({
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        type: String
    })
    numberPlate: string;

    @Prop({
        required: true,
        trim: true,
        lowercase: true,
        type: String
    })
    type: string;

    @Prop({
        required: true,
        trim: true,
        lowercase: true,
        type: String
    })
    model: string;

}

export const vehicleDetailsSchema = SchemaFactory.createForClass(VehicleDetails);

@Schema({ timestamps: true })
export class User {
    @Prop({
        required: true,
        trim: true
    })
    name: string

    @Prop()
    profilePic: string

    @Prop({
        required: true
    })
    password: string

    @Prop({
        required: true,
        unique: true,
    })
    contactNumber: number;

    @Prop()
    refreshToken: string;

    @Prop({
        required: true,
        default: false,
    })
    isContactNumberVerified: boolean;
    @Prop({
        required: true,
        default: 'user',
    })
    role: 'admin' | 'user' | 'super-admin' | 'driver';
    @Prop({
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] },
    })
    location?: {
        type: string;
        coordinates: number[];
    };

    @Prop({
        type: Types.ObjectId,
        ref: VehicleDetails.name
    })
    vehicleDetails?: Types.ObjectId;

}


export const UserSchema = SchemaFactory.createForClass(User);