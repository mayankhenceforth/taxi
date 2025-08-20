import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example:'------'})  
  @IsNumber()
  otp: number;
}
