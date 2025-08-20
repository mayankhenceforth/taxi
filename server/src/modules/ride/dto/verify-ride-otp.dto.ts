import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, Min, Max } from "class-validator";

export class VerifyRideOtpDto {
  @ApiProperty({
    description: '4-digit OTP for ride verification',
    example: 1234,
  })
  @IsNotEmpty({ message: 'OTP is required' })
  @IsNumber({}, { message: 'OTP must be a number' })
  @Min(1000, { message: 'OTP must be 4 digits' })
  @Max(9999, { message: 'OTP must be 4 digits' })
  otp: number;
}
