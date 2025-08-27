import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

export enum EarningsStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  PAID = 'paid',
}

@Schema({ timestamps: true })
export class PlatformEarningCollection {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true })
  rideId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true })
  driverId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true })
  paymentId: Types.ObjectId;

  @Prop({ default: 0 })
  amount: number;

  @Prop({ type: String, enum: EarningsStatus, default: EarningsStatus.PAID })
  status: EarningsStatus;

   @Prop({
    required: true,
    type: String,
    enum: ['processing', 'accepted', 'arrived', 'started', 'completed', 'cancelled', 'terminated'],
    default: 'processing'
  })
  rideStatus: string;
  
}

export type PlatformEarningDocument = PlatformEarningCollection & Document;
export const PlatformEarningSchema = SchemaFactory.createForClass(PlatformEarningCollection);
