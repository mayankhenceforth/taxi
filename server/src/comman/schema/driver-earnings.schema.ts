import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DriverEarningsDocument = DriverEarnings & Document;

export enum EarningsType {
  RIDE = 'ride',
  BONUS = 'bonus',
  REFERRAL = 'referral',
  ADJUSTMENT = 'adjustment'
}

export enum EarningsStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  PAID = 'paid'
}

@Schema({ timestamps: true })
export class DriverEarnings {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  driverId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Ride' }] }) 
  rideIds: Types.ObjectId[];

  @Prop({ required: true, enum: EarningsType })
  type: EarningsType;

  @Prop({ required: true })
  amount: number;


  @Prop({ enum: EarningsStatus, default: EarningsStatus.PENDING })
  status: EarningsStatus;



  
}

export const DriverEarningsSchema = SchemaFactory.createForClass(DriverEarnings);
