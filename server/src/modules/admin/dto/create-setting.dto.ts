// src/modules/settings/dto/create-setting.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsObject, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

class RefundPolicyScenario {
  @ApiProperty({
    description: 'Percentage of fare refunded to the user',
    example: 100,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  refundPercent: number;

  @ApiProperty({
    description: 'Percentage of fare allocated to the driver',
    example: 0,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  driverEarningPercent: number;

  @ApiProperty({
    description: 'Percentage of fare retained by the platform',
    example: 0,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  platformEarningPercent: number;
}

class DriverCancellationPolicy {
  @ApiProperty({
    description: 'Policy for driver cancellation before arriving',
    type: () => RefundPolicyScenario,
  })
  @ValidateNested()
  @Type(() => RefundPolicyScenario)
  default: RefundPolicyScenario;

  @ApiProperty({
    description: 'Policy for driver cancellation after arriving',
    type: () => RefundPolicyScenario,
  })
  @ValidateNested()
  @Type(() => RefundPolicyScenario)
  arrived: RefundPolicyScenario;
}

class UserCancellationPolicy {
  @ApiProperty({
    description: 'Policy for user cancellation within 10 minutes',
    type: () => RefundPolicyScenario,
  })
  @ValidateNested()
  @Type(() => RefundPolicyScenario)
  within10Min: RefundPolicyScenario;

  @ApiProperty({
    description: 'Policy for user cancellation within 15 minutes',
    type: () => RefundPolicyScenario,
  })
  @ValidateNested()
  @Type(() => RefundPolicyScenario)
  within15Min: RefundPolicyScenario;

  @ApiProperty({
    description: 'Policy for user cancellation within 20 minutes',
    type: () => RefundPolicyScenario,
  })
  @ValidateNested()
  @Type(() => RefundPolicyScenario)
  within20Min: RefundPolicyScenario;

  @ApiProperty({
    description: 'Policy for user cancellation after 20 minutes',
    type: () => RefundPolicyScenario,
  })
  @ValidateNested()
  @Type(() => RefundPolicyScenario)
  after20Min: RefundPolicyScenario;
}

class RefundPolicy {
  @ApiProperty({
    description: 'Policy for cancellations initiated by the driver',
    type: () => DriverCancellationPolicy,
  })
  @ValidateNested()
  @Type(() => DriverCancellationPolicy)
  driverCancellation: DriverCancellationPolicy;

  @ApiProperty({
    description: 'Policy for cancellations initiated by the user',
    type: () => UserCancellationPolicy,
  })
  @ValidateNested()
  @Type(() => UserCancellationPolicy)
  userCancellation: UserCancellationPolicy;

  @ApiProperty({
    description: 'Policy for cancellations initiated by the system',
    type: () => RefundPolicyScenario,
  })
  @ValidateNested()
  @Type(() => RefundPolicyScenario)
  systemCancellation: RefundPolicyScenario;
}

export class CreateSettingDto {
  @ApiProperty({
    description: 'Base fare for bike rides',
    example: 15,
    default: 15,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  bikeBaseFare: number;

  @ApiProperty({
    description: 'Base fare for car rides',
    example: 20,
    default: 20,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  carBaseFare: number;

  @ApiProperty({
    description: 'GST percentage for bike rides',
    example: 12,
    default: 12,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  bikeGstPercent: number;

  @ApiProperty({
    description: 'GST percentage for car rides',
    example: 16,
    default: 16,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  carGstPercent: number;

  @ApiProperty({
    description: 'Platform fee percentage',
    example: 20,
    default: 20,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  platformFeePercent: number;

  @ApiProperty({
    description: 'Night charge percentage',
    example: 25,
    default: 25,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  nightChargePercent: number;

  @ApiProperty({
    description: 'General waiting charge per minute (if vehicle-specific not provided)',
    example: 1,
    default: 1,
    type: Number,
    required: false,
  })
  @IsNumber()
  @Min(0)
  waitingChargePerMin?: number;

  @ApiProperty({
    description: 'Waiting charge per minute for bike rides',
    example: 1,
    default: 1,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  bikeWaitingChargePerMin: number;

  @ApiProperty({
    description: 'Waiting charge per minute for car rides',
    example: 2,
    default: 2,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  carWaitingChargePerMin: number;

  @ApiProperty({
    description: 'Parking fee',
    example: 30,
    default: 30,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  parkingFee: number;

  @ApiProperty({
    description: 'Toll price per kilometer',
    example: 2,
    default: 2,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  tollPricePerKm: number;

  @ApiProperty({
    description: 'Refund policy configuration',
    type: () => RefundPolicy,
    example: {
      driverCancellation: {
        default: { refundPercent: 100, driverEarningPercent: 0, platformEarningPercent: 0 },
        arrived: { refundPercent: 80, driverEarningPercent: 15, platformEarningPercent: 5 },
      },
      userCancellation: {
        within10Min: { refundPercent: 85, driverEarningPercent: 10, platformEarningPercent: 5 },
        within15Min: { refundPercent: 80, driverEarningPercent: 15, platformEarningPercent: 5 },
        within20Min: { refundPercent: 75, driverEarningPercent: 20, platformEarningPercent: 5 },
        after20Min: { refundPercent: 50, driverEarningPercent: 40, platformEarningPercent: 10 },
      },
      systemCancellation: { refundPercent: 100, driverEarningPercent: 0, platformEarningPercent: 0 },
    },
  })
  @IsObject()
  @ValidateNested()
  @Type(() => RefundPolicy)
  refundPolicy: RefundPolicy;
}