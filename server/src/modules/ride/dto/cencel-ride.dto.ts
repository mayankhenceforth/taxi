import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, Min, Max } from "class-validator";

export class cencelRideDto {
@ApiProperty({
    description: 'Reason for cancelling the ride',
    example: 'Driver arrived late',
})
@IsNotEmpty({ message: 'Cancellation reason is required' })
reason: string;


}
