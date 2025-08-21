import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';
import { User } from './user.schema';

export type RideDocument = Ride & Document;

@Schema({
  timestamps: true
})
export class Ride {

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: User.name,
  })
  bookedBy: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
  })
  driver?: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['bike', 'car'],
    required: true
  })
  vehicleType: 'bike' | 'car';

  @Prop({
    type: Number,
    required: true,
    default: 5
  })
  sentToRadius: number;

  @Prop({
    type: Number,
    required: true
  })
  distance: number;

  @Prop({
    type: Number,
    required: true
  })
  TotalFare: number;

  @Prop({
    required: true,
    type: String,
    enum: ['processing', 'accepted', 'started', 'completed', 'cancelled', 'terminated'],
    default: 'processing',
  })
  status: string;

  @Prop({
    required: true,
    enum: ['paid', 'unpaid'],
    default: 'unpaid',
  })
  paymentStatus: 'unpaid' | 'paid';

  @Prop({
    enum: ['none', 'requested', 'processed'],
    default: 'none',
  })
  refundStatus?: 'none' | 'requested' | 'processed';



  @Prop({
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  })
  pickupLocation: {
    type: string;
    coordinates: number[];
  };

  @Prop({
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  })
  dropoffLocation: {
    type: string;
    coordinates: number[];
  };

  @Prop({ required: false })
  otp: number

  @Prop({ required: false })
  cancelReason?: string;

  @Prop({
    required: false,
    enum: ['User', 'Driver']
  })
  cancelledBy?: 'User' | 'Driver';

  @Prop({ required: false })
invoiceUrl?: string;

  @Prop({
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    index: { expires: 0 }
  })
  expiresAt: Date;
}

export const RideSchema = SchemaFactory.createForClass(Ride);

export type TemporaryRideDocument = TemporaryRide & Document;

@Schema({
  timestamps: true
})
export class TemporaryRide {

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: User.name,
  })
  bookedBy: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['bike', 'car'],
    required: true
  })
  vehicleType: 'bike' | 'car';

  @Prop({
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  })
  pickupLocation: {
    type: string;
    coordinates: number[];
  };

  @Prop({
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  })
  dropoffLocation: {
    type: string;
    coordinates: number[];
  };


  @Prop({
    required: true,
    type: Number
  })
  distance: number;

  @Prop({
    required: true,
    type: Number
  })
  fare: number;


  @Prop({
    required: true,
    type: String,
    enum: ['processing', 'accepted', 'started', 'completed', 'cancelled', 'terminated'],
    default: 'processing',
  })
  status: string;

  @Prop({ type: [Types.ObjectId], ref: User.name, default: [] })
  eligibleDrivers: Types.ObjectId[];

  @Prop({
    default: Date.now,
    index: {
      expires: 86400,
    },
  })
  createdAt: Date;

}

export const TemporaryRideSchema = SchemaFactory.createForClass(TemporaryRide);  