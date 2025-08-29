import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TotalRideEarningDocument = TotalRideEarning & Document;

@Schema({ timestamps: true })
export class TotalRideEarning {
  @Prop({ type: Types.ObjectId, ref: 'PlatformEarningCollection', required: true })
  platformEarningId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'DriverEarning', required: true })
  driverEarningId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  totalAmount: number;

  @Prop({ type: Number, required: true })
  gstAmount: number;

  @Prop({ type: Number, required: true })
  driverEarning: number;

  @Prop({ type: Number, required: true })
  platformEarning: number;

   @Prop({ type: Number, required: true })
  otherCharges: number;


  @Prop({ type: Types.ObjectId, ref: 'Ride', required: true, unique: true })
  rideId: Types.ObjectId;
}

export const TotalRideEarningSchema = SchemaFactory.createForClass(TotalRideEarning);
