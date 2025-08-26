import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

export enum EarningsStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  PAID = 'paid',
}

@Schema({ timestamps: true })
export class DriverEarning {
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

  @Prop({ type: String, enum: EarningsStatus, default: EarningsStatus.PENDING })
  status: EarningsStatus;

   @Prop({
    required: true,
    type: String,
    enum: ['processing', 'accepted', 'arrived', 'started', 'completed', 'cancelled', 'terminated'],
    default: 'processing'
  })
  rideStatus: string;
  
  @Prop({
     enum: ['unpaid', 'paid'],
     default:"unpaid"
  })
  driverPaymentStatus:'unpaid' | 'paid'
}

export type DriverEarningDocument = DriverEarning & Document;
export const DriverEarningSchema = SchemaFactory.createForClass(DriverEarning);
