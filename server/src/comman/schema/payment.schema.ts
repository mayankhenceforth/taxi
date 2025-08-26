import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { Ride } from './ride.schema';
import { User } from './user.schema';

export type PaymentDocument = Payment & Document;

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  WALLET = 'wallet',
  UPI = 'upi',
  OTHER = 'other',
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentType {
  RIDE = 'ride',
  REFUND = 'refund',
  WITHDRAWAL = 'withdrawal',
  BONUS = 'bonus',
  OTHER = 'other',
}

export enum RefundStatus {
  NONE = 'none',
  PROCESSED = 'processed',
  FAILED = 'failed',
}

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true })
   rideId: Types.ObjectId;
 
   @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true })
   driverId: Types.ObjectId;
 
   @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
   userId: Types.ObjectId;

  @Prop({ required: true, type: Number })
  amount: number;

  @Prop()
  currency: string

//   @Prop({ required: true, enum: Object.values(PaymentType) })
//   type: PaymentType;

//   @Prop({ required: true, enum: Object.values(PaymentMethod) })
//   method: PaymentMethod;

 @Prop({ required: true, enum: ['paid', 'unpaid','failed', 'refunded', 'partially_refunded'], default: 'unpaid' })
  status: 'unpaid' | 'paid' | 'refunded' | 'partially_refunded' | 'failed';

  @Prop()
  transactionId?: string;

  @Prop({ required: false })
  paymentIntentId?: string;

  @Prop()
  checkoutSessionId?: string;

  @Prop({ type: Number, default: 0 })
  refundAmount?: number;

  @Prop({ type: Number, default: 0 })
  refundPercentage?: number;

  @Prop({ enum: ['processed' , 'failed' , 'not_applicable','none'], default: 'none' })
  refundStatus?: 'processed' | 'failed' | 'not_applicable' |'none';

  @Prop({default:''})
  refundId?: string

  @Prop()
  refundReason?: string;

  @Prop({ type: Date })
  refundedAt?: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ rideId: 1 });
PaymentSchema.index({ type: 1 });
PaymentSchema.index({ refundStatus: 1 });
