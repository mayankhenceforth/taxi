import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class SetupDriverAccountDto {
 @ApiProperty({ example: [30.7068928,76.7688704] })
  @IsNotEmpty()
  readonly coordinates: [number, number];

  @ApiProperty({
    example: {
      type: 'BIKE',
      numberPlate: 'KA-123-ABC',
      model: 'Super Suplendor',
    },
  })
  @IsNotEmpty()
  readonly vehicleInfo?: {
    type: string;
    numberPlate: string;
    model: string;
  };

}
