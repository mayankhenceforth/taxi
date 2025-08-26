import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DriverPayoutDocument = DriverPayout & Document;

export enum DriverPayoutMethod {
  BANK = 'bank',
  UPI = 'upi',
  CARD = 'card',
  WALLET = 'wallet',
}

@Schema({ timestamps: true })
export class DriverPayout {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  driverId: Types.ObjectId;

  @Prop({ required: true, enum: DriverPayoutMethod })
  method: DriverPayoutMethod;

  @Prop({ required: true })
  accountNumber: string;

  @Prop()
  ifsc?: string;

  @Prop({ required: true })
  accountHolderName: string;

  @Prop()
  nickname?: string;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ default: true })
  isActive: boolean; 
}

export const DriverPayoutSchema = SchemaFactory.createForClass(DriverPayout);
