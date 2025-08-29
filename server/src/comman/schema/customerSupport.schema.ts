import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { User } from "./user.schema";
import { Types } from "mongoose";
import { Ride } from "./ride.schema";

export type CustomerSupportDocument = CustomerSupport & Document
@Schema({ timestamps: true })
export class CustomerSupport {
  @Prop({ required: true, type: Types.ObjectId, ref: User.name })
  userId: Types.ObjectId;

  @Prop({ required: true })
  role: 'user' | 'driver';

  @Prop({ type: Types.ObjectId, ref: 'Ride', required: true })
  rideId: Types.ObjectId;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  message: string;

  @Prop({
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
  })
  status: 'open'| 'in_progress'| 'resolved'| 'closed';

  @Prop({ default: null })
  assignedTo?: string;
}

export const CustomerSupportSchema = SchemaFactory.createForClass(CustomerSupport);
