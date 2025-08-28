import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

export type SettingDocument = Setting & Document

@Schema({ timestamps: true })
export class Setting  {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  adminId: Types.ObjectId;

  @Prop({ type: Number, required: true, default: 15 })
  bikeBaseFare: number;

  @Prop({ type: Number, required: true, default: 20 })
  carBaseFare: number;

  @Prop({ type: Number, required: true, default: 12 })
  bikeGstPercent: number;

  @Prop({ type: Number, required: true, default: 16 })
  carGstPercent: number;

  @Prop({ type: Number, required: true, default: 20 })
  platformFeePercent: number;

  @Prop({ type: Number, required: true, default: 25 })
  nightChargePercent: number;

  @Prop({ type: Number, required: false, default: 1 })
  waitingChargePerMin: number;

  @Prop({ required: true, default: 1 })
  bikeWaitingChargePerMin: number;

  @Prop({ required: true, default: 2 })
  carWaitingChargePerMin: number;

  @Prop({ type: Number, required: true, default: 30 })
  parkingFee: number;

  @Prop({ type: Number, required: true, default: 2 })
  tollPricePerKm: number;

  @Prop({
    type: {
      driverCancellation: {
        default: {
          refundPercent: { type: Number, required: true, default: 100 },
          driverEarningPercent: { type: Number, required: true, default: 0 },
          platformEarningPercent: { type: Number, required: true, default: 0 },
        },
        arrived: {
          refundPercent: { type: Number, required: true, default: 80 },
          driverEarningPercent: { type: Number, required: true, default: 15 },
          platformEarningPercent: { type: Number, required: true, default: 5 },
        },
      },
      userCancellation: {
        within10Min: {
          refundPercent: { type: Number, required: true, default: 85 },
          driverEarningPercent: { type: Number, required: true, default: 10 },
          platformEarningPercent: { type: Number, required: true, default: 5 },
        },
        within15Min: {
          refundPercent: { type: Number, required: true, default: 80 },
          driverEarningPercent: { type: Number, required: true, default: 15 },
          platformEarningPercent: { type: Number, required: true, default: 5 },
        },
        within20Min: {
          refundPercent: { type: Number, required: true, default: 75 },
          driverEarningPercent: { type: Number, required: true, default: 20 },
          platformEarningPercent: { type: Number, required: true, default: 5 },
        },
        after20Min: {
          refundPercent: { type: Number, required: true, default: 50 },
          driverEarningPercent: { type: Number, required: true, default: 40 },
          platformEarningPercent: { type: Number, required: true, default: 10 },
        },
      },
      systemCancellation: {
        refundPercent: { type: Number, required: true, default: 100 },
        driverEarningPercent: { type: Number, required: true, default: 0 },
        platformEarningPercent: { type: Number, required: true, default: 0 },
      },
    },
    required: true,
  })
  refundPolicy: {
    driverCancellation: {
      default: {
        refundPercent: number;
        driverEarningPercent: number;
        platformEarningPercent: number;
      };
      arrived: {
        refundPercent: number;
        driverEarningPercent: number;
        platformEarningPercent: number;
      };
    };
    userCancellation: {
      within10Min: {
        refundPercent: number;
        driverEarningPercent: number;
        platformEarningPercent: number;
      };
      within15Min: {
        refundPercent: number;
        driverEarningPercent: number;
        platformEarningPercent: number;
      };
      within20Min: {
        refundPercent: number;
        driverEarningPercent: number;
        platformEarningPercent: number;
      };
      after20Min: {
        refundPercent: number;
        driverEarningPercent: number;
        platformEarningPercent: number;
      };
    };
    systemCancellation: {
      refundPercent: number;
      driverEarningPercent: number;
      platformEarningPercent: number;
    };
  };
}

export const SettingSchema = SchemaFactory.createForClass(Setting);