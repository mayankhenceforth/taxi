import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';
import { User } from './user.schema';

export type RideDocument = Ride & Document;

@Schema({
  timestamps: true
})
export class Ride {
  @Prop({ required: true, type: Types.ObjectId, ref: User.name })
  bookedBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name })
  driver?: Types.ObjectId;

  @Prop({ type: String, enum: ['bike', 'car'], required: true })
  vehicleType: 'bike' | 'car';

  @Prop({ type: Number, required: true, default: 5 })
  sentToRadius: number;

  @Prop({ type: Number, required: true })
  distance: number;

  // Base fare calculation
  @Prop({ type: Number, required: true })
  baseFare: number;

  // Additional charges
  @Prop({ type: Number, default: 0 })
  gstAmount: number;

  @Prop({ type: Number, default: 0 })
  platformFee: number;

  @Prop({ type: Number, default: 0 })
  surgeMultiplier: number;

  @Prop({ type: Number, default: 0 })
  surgeCharge: number;

  @Prop({ type: Number, default: 0 })
  nightCharge: number;

  @Prop({ type: Number, default: 0 })
  tollFee: number;

  @Prop({ type: Number, default: 0 })
  parkingFee: number;

  @Prop({ type: Number, default: 0 })
  waitingCharge: number;

  @Prop({ type: Number, default: 0 })
  cancellationFee: number;

  @Prop({ type: Number, default: 0 })
  bonusAmount: number;

  @Prop({ type: Number, default: 0 })
  referralDiscount: number;

  @Prop({ type: Number, default: 0 })
  promoDiscount: number;

  @Prop({ type: String })
  promoCode?: string;

  // Total calculations
  @Prop({ type: Number, required: true })
  subTotal: number;

  @Prop({ type: Number, required: true })
  TotalFare: number;

  @Prop({ type: Number, required: true })
  driverEarnings: number;

  @Prop({ type: Number, required: true })
  platformEarnings: number;

  // Payment breakdown
  @Prop({ type: {
    baseFare: Number,
    gstAmount: Number,
    platformFee: Number,
    surgeCharge: Number,
    nightCharge: Number,
    tollFee: Number,
    parkingFee: Number,
    waitingCharge: Number,
    bonusAmount: Number,
    referralDiscount: Number,
    promoDiscount: Number,
    subTotal: Number,
    totalFare: Number
  }, default: {} })
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

  @Prop({ required: true, type: String, enum: ['processing', 'accepted', 'started', 'completed', 'cancelled', 'terminated'], default: 'processing' })
  status: string;

  @Prop({ required: true, enum: ['paid', 'unpaid', 'refunded', 'partially_refunded'], default: 'unpaid' })
  paymentStatus: 'unpaid' | 'paid' | 'refunded' | 'partially_refunded';

  @Prop({ enum: ['none', 'requested', 'processed', 'failed'], default: 'none' })
  refundStatus?: 'none' | 'requested' | 'processed' | 'failed';

  @Prop({ type: Number, default: 0 })
  refundAmount?: number;

  @Prop({ type: Number, default: 0 })
  refundPercentage?: number;

  @Prop({ type: String, required: false })
  refundReason?: string;

  @Prop({ type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: [0, 0] } })
  pickupLocation: { type: string; coordinates: number[] };

  @Prop({ type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: [0, 0] } })
  dropoffLocation: { type: string; coordinates: number[] };

  @Prop({ required: false })
  otp: number;

  @Prop({ required: false })
  cancelReason?: string;

  @Prop({ required: false, enum: ['User', 'Driver'] })
  cancelledBy?: 'User' | 'Driver';

  @Prop({ required: false })
  invoiceUrl?: string;

  @Prop({ required: false })
  paymentIntentId?: string;

  @Prop({ required: false })
  checkoutSessionId?: string;

  // Timestamps
  @Prop({ type: Date }) completedAt?: Date;
  @Prop({ type: Date }) startedAt?: Date;
  @Prop({ type: Date }) acceptedAt?: Date;
  @Prop({ type: Date }) cancelledAt?: Date;
  @Prop({ type: Date }) terminatedAt?: Date;
  @Prop({ type: Date }) paidAt?: Date;
  @Prop({ type: Date }) refundedAt?: Date;
  @Prop({ type: Date }) createdAt: Date;
  @Prop({ type: Date }) updatedAt: Date;
}

export const RideSchema = SchemaFactory.createForClass(Ride);
RideSchema.index({ pickupLocation: '2dsphere' });
RideSchema.index({ dropoffLocation: '2dsphere' });

export type TemporaryRideDocument = TemporaryRide & Document;

@Schema({
  timestamps: true
})
export class TemporaryRide {
  @Prop({ required: true, type: Types.ObjectId, ref: User.name })
  bookedBy: Types.ObjectId;

  @Prop({ type: String, enum: ['bike', 'car'], required: true })
  vehicleType: 'bike' | 'car';

  @Prop({ type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: [0, 0] } })
  pickupLocation: { type: string; coordinates: number[] };

  @Prop({ type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: [0, 0] } })
  dropoffLocation: { type: string; coordinates: number[] };

  @Prop({ required: true, type: Number })
  distance: number;

  // Temporary ride fare details
  @Prop({ type: Number, required: true })
  baseFare: number;

  @Prop({ type: Number, default: 0 })
  estimatedGst: number;

  @Prop({ type: Number, default: 0 })
  estimatedPlatformFee: number;

  @Prop({ type: Number, default: 1 })
  surgeMultiplier: number;

  @Prop({ type: Number, required: true })
  fare: number;

  @Prop({ required: true, type: String, enum: ['processing', 'accepted', 'started', 'completed', 'cancelled', 'terminated'], default: 'processing' })
  status: string;

  @Prop({ type: [Types.ObjectId], ref: User.name, default: [] })
  eligibleDrivers: Types.ObjectId[];

  @Prop({ default: Date.now, index: { expires: 86400 } })
  createdAt: Date;
}

export const TemporaryRideSchema = SchemaFactory.createForClass(TemporaryRide);