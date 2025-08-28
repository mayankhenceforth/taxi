import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({ example:"+911234567890"})
  @IsNotEmpty()
  @IsNumber()
  readonly contactNumber: number;

  @ApiProperty({ example: '' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  readonly password: string;


}
