import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
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

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true, type: Types.ObjectId, ref: User.name })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Ride.name })
  rideId?: Types.ObjectId;

  @Prop({ required: true, type: Number })
  amount: number;

  @Prop({ required: true, enum: Object.values(PaymentType) })
  type: PaymentType;

  @Prop({ required: true, enum: Object.values(PaymentMethod) })
  method: PaymentMethod;

  @Prop({ required: true, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop()
  transactionId?: string;

  @Prop()
  paymentIntentId?: string;

  @Prop()
  checkoutSessionId?: string;

  @Prop({ type: Number, default: 0 })
  refundAmount?: number;

  @Prop()
  refundReason?: string;

  @Prop({ type: Date })
  refundedAt?: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ rideId: 1 });
PaymentSchema.index({ type: 1 });
