import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class SignUpDto {
  @ApiProperty({ example: '' })
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @ApiProperty({ example: '' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  readonly password: string;

  @ApiProperty({ example:1234567890})
  @IsNotEmpty()
  @IsNumber()
  readonly contactNumber: number;

  @ApiProperty({ example: 'user' })
  readonly role ?: 'user' | 'driver';

}
