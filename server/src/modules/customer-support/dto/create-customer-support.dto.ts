import { IsNotEmpty, IsString, IsIn } from 'class-validator';
import { Types } from 'mongoose';
import { Type } from 'class-transformer';

export class CreateCustomerSupportDto {
  @IsNotEmpty()
  @Type(() => Types.ObjectId) 
  rideId: Types.ObjectId;

  @IsNotEmpty()
  @Type(() => Types.ObjectId) 
  userId: Types.ObjectId;

  @IsNotEmpty()
  @IsIn(['user', 'driver'])
  role: 'user' | 'driver';

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsNotEmpty()
  @IsString()
  message: string;
}
