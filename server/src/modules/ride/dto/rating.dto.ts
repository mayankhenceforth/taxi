import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class RideRatingDto {
  
    @ApiProperty({ example: 5 })
      @IsNotEmpty()
      readonly rating:number;
    
      @ApiProperty({ example:"Good driver " })
      readonly message:string;
    
}
