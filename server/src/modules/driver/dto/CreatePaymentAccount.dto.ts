import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsBoolean, ValidateIf } from "class-validator";

export enum DriverPayoutMethod {
  BANK = 'bank',
  UPI = 'upi',
  CARD = 'card',
  WALLET = 'wallet',
}

export class CreateDriverPayoutDto {
  @ApiProperty({ description: 'Driver ID', example: '68a40f7471712b5dedf3edd6' })
  @IsNotEmpty()
  driverId: string;

  @ApiProperty({ description: 'Payout method type', enum: DriverPayoutMethod })
  @IsEnum(DriverPayoutMethod)
  @IsNotEmpty()
  method: DriverPayoutMethod;

  @ApiProperty({ description: 'Bank name (required if BANK method)', example: 'State Bank of India', required: false })
  @ValidateIf(o => o.method === DriverPayoutMethod.BANK)
  @IsString()
  @IsNotEmpty()
  bankName?: string;

  @ApiProperty({ description: 'Account number (required if BANK method)', example: '123456789012' })
  @ValidateIf(o => o.method === DriverPayoutMethod.BANK)
  @IsString()
  @IsNotEmpty()
  accountNumber?: string;

  @ApiProperty({ description: 'IFSC code (required if BANK method)', example: 'SBIN0001234' })
  @ValidateIf(o => o.method === DriverPayoutMethod.BANK)
  @IsString()
  @IsNotEmpty()
  ifsc?: string;

  @ApiProperty({ description: 'Account holder name (required if BANK method)', example: 'John Doe' })
  @ValidateIf(o => o.method === DriverPayoutMethod.BANK)
  @IsString()
  @IsNotEmpty()
  accountHolderName?: string;

  @ApiProperty({ description: 'UPI ID (required if UPI method)', example: 'john@upi', required: false })
  @ValidateIf(o => o.method === DriverPayoutMethod.UPI)
  @IsString()
  @IsNotEmpty()
  upiId?: string;

  @ApiProperty({ description: 'Card number (required if CARD method)', example: '4111111111111111', required: false })
  @ValidateIf(o => o.method === DriverPayoutMethod.CARD)
  @IsString()
  @IsNotEmpty()
  cardNumber?: string;

  @ApiProperty({ description: 'Optional label/nickname for this payout account', example: 'Primary Bank Account', required: false })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiProperty({ description: 'Mark this account as default', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
