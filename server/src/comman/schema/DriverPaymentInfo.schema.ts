import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DriverPayout } from './payout.schema';

export type DriverPaymentDocument = DriverPayment & Document;

export enum DriverPaymentStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    PAID = 'paid',
    FAILED = 'failed',
}

@Schema({ timestamps: true })
export class DriverPayment {
    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    driverId: Types.ObjectId;
    
    @Prop({ type: Types.ObjectId, ref: DriverPayout.name })
    payoutMethod?: Types.ObjectId;

    @Prop({ type: Number, default: 0 })
    totalEarnings: number;

    @Prop({ type: Number, default: 0 })
    balance: number;

    @Prop({ enum: Object.values(DriverPaymentStatus), default: DriverPaymentStatus.PENDING })
    status: DriverPaymentStatus;

    

    @Prop()
    payoutTransactionId?: string;

    @Prop({ type: Number, default: 0 })
    lastPayoutAmount: number;

    @Prop()
    lastPayoutDate?: Date;

    @Prop()
    remarks?: string;
}

export const DriverPaymentSchema = SchemaFactory.createForClass(DriverPayment);
DriverPaymentSchema.index({ driverId: 1 });
DriverPaymentSchema.index({ status: 1 });
