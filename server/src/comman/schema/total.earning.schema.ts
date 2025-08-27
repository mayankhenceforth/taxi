import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { Types } from "mongoose";



@Schema({ timestamps: true })
export class TotalRideEarning {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true })
    rideId: Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true })
    driverId: Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true })
    paymentId: Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'DriverEarning', required: true })
    driverEarning: Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'PlatformEarningCollection', required: true })
    plateformEarning: Types.ObjectId;


}



export type TotalRideEarningDocument = TotalRideEarning & Document;
export const TotalRideEarningSchema = SchemaFactory.createForClass(TotalRideEarning)