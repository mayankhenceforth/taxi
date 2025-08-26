import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RideRatingDocument = RideRating & Document;

@Schema({ timestamps: true })
export class RideRating {
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'User',
  })
  driver: Types.ObjectId;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'User',
  })
  user: Types.ObjectId;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Ride',
  })
  ride: Types.ObjectId;

  @Prop({
    required: true,
    min: 1,
    max: 5,
  })
  rating: number;

  @Prop()
  message?: string;
}

export const RideRatingSchema = SchemaFactory.createForClass(RideRating);
