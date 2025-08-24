import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  Min,
  Max,
  IsArray,
  IsObject,
  ValidateIf,
  IsDateString,
  ArrayMinSize,
} from 'class-validator';
import { Transform } from 'class-transformer'; 
// import { Transform } from 'node:stream';

class DriverLicenseDto {
  @ApiProperty({
    example: 'DL123456789',
    description: 'Driver license number',
    required: false,
    type: String,
  })
  @ValidateIf(o => o.role === 'driver')
  @IsNotEmpty({ message: 'License number is required for drivers' })
  @IsString()
  licenseNumber: string;

  @ApiProperty({
    example: '2023-01-15',
    description: 'License issue date',
    required: false,
    type: String,
    format: 'date',
  })
  @ValidateIf(o => o.role === 'driver')
  @IsNotEmpty({ message: 'Issue date is required for drivers' })
  @IsDateString()
  issueDate: string;

  @ApiProperty({
    example: '2033-01-15',
    description: 'License expiry date',
    required: false,
    type: String,
    format: 'date',
  })
  @ValidateIf(o => o.role === 'driver')
  @IsNotEmpty({ message: 'Expiry date is required for drivers' })
  @IsDateString()
  expiryDate: string;

  @ApiProperty({
    example: 'State RTO',
    description: 'Issuing authority',
    required: false,
    type: String,
  })
  @ValidateIf(o => o.role === 'driver')
  @IsNotEmpty({ message: 'Issuing authority is required for drivers' })
  @IsString()
  issuingAuthority: string;
}

class VehicleDetailsDto {
  @ApiProperty({
    example: 'ABC1234',
    description: 'Vehicle number plate',
    required: false,
    type: String,
  })
  @ValidateIf(o => o.role === 'driver')
  @IsNotEmpty({ message: 'Number plate is required for drivers' })
  @IsString()
  @Transform(({ value }) => value.toUpperCase()) // Convert to uppercase
  numberPlate: string;

  @ApiProperty({
    example: 'car',
    description: 'Vehicle type',
    enum: ['car', 'bike', 'truck'],
    required: false,
    type: String,
  })
  @ValidateIf(o => o.role === 'driver')
  @IsNotEmpty({ message: 'Vehicle type is required for drivers' })
  @IsEnum(['car', 'bike', 'truck'])
  type: string;

  @ApiProperty({
    example: 'Toyota Camry',
    description: 'Vehicle model',
    required: false,
    type: String,
  })
  @ValidateIf(o => o.role === 'driver')
  @IsNotEmpty({ message: 'Vehicle model is required for drivers' })
  @IsString()
  model: string;
}

class LocationDto {
  @ApiProperty({
    example: 'Point',
    description: 'Location type',
    required: false,
    type: String,
    default: 'Point'
  })
  @ValidateIf(o => o.role === 'driver')
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({
    example: 77.2090,
    description: 'Longitude coordinate',
    required: false,
    type: Number,
  })
  @ValidateIf(o => o.role === 'driver')
  @IsNotEmpty({ message: 'Longitude is required for drivers' })
  @IsNumber()
  longitude: number;

  @ApiProperty({
    example: 28.6139,
    description: 'Latitude coordinate',
    required: false,
    type: Number,
  })
  @ValidateIf(o => o.role === 'driver')
  @IsNotEmpty({ message: 'Latitude is required for drivers' })
  @IsNumber()
  latitude: number;
}

export class SignUpDto {
  @ApiProperty({ 
    example: 'John Doe',
    description: 'Full name of the user',
    required: true,
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  readonly name: string;

  @ApiProperty({ 
    example: 'password123',
    description: 'User password (min 6 characters)',
    required: true,
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  readonly password: string;

  @ApiProperty({ 
    example: 1234567890,
    description: '10-digit contact number',
    required: true,
    type: String,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1000000000, { message: 'Contact number must be 10 digits' })
  @Max(9999999999, { message: 'Contact number must be 10 digits' })
  readonly contactNumber: number;

  @ApiProperty({ 
    example: '+91',
    description: 'Country calling code (e.g., +91)',
    required: true,
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly countryCode: string;

  @ApiProperty({ 
    example: 'user@example.com',
    description: 'Email address',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  readonly email?: string;

  @ApiProperty({ 
    example: 'user',
    description: 'User role',
    required: true,
    enum: ['user', 'driver'],
    type: String,
  })
  @IsNotEmpty({ message: 'Role is required' })
  @IsEnum(['user', 'driver'], { 
    message: 'Role must be either "user" or "driver"' 
  })
  readonly role: 'user' | 'driver';

  @ApiProperty({ 
    example: 'https://example.com/profile.jpg',
    description: 'Profile picture URL',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly profilePic?: string;

  // Driver-specific fields (will show conditionally based on role)
  @ApiProperty({
    example: 'DL123456789',
    description: 'Driver license number (required for drivers)',
    required: false,
    type: String,
  })
  @ValidateIf(o => o.role === 'driver')
  @IsOptional()
  @IsString()
  driverLicenseNumber?: string;

  @ApiProperty({
    example: '2023-01-15',
    description: 'License issue date (required for drivers)',
    required: false,
    type: String,
    format: 'date',
  })
  @ValidateIf(o => o.role === 'driver')
  @IsOptional()
  @IsDateString()
  licenseIssueDate?: string;

  @ApiProperty({
    example: '2033-01-15',
    description: 'License expiry date (required for drivers)',
    required: false,
    type: String,
    format: 'date',
  })
  @ValidateIf(o => o.role === 'driver')
  @IsOptional()
  @IsDateString()
  licenseExpiryDate?: string;

  @ApiProperty({
    example: 'State RTO',
    description: 'Issuing authority (required for drivers)',
    required: false,
    type: String,
  })
  @ValidateIf(o => o.role === 'driver')
  @IsOptional()
  @IsString()
  issuingAuthority?: string;

  @ApiProperty({
    example: 'ABC1234',
    description: 'Vehicle number plate (required for drivers)',
    required: false,
    type: String,
  })
  @ValidateIf(o => o.role === 'driver')
  @IsOptional()
  @IsString()
  vehicleNumberPlate?: string;

  @ApiProperty({
    example: 'car',
    description: 'Vehicle type (required for drivers)',
    enum: ['car', 'bike', 'truck'],
    required: false,
    type: String,
  })
  @ValidateIf(o => o.role === 'driver')
  @IsOptional()
  @IsEnum(['car', 'bike', 'truck'])
  vehicleType?: string;

  @ApiProperty({
    example: 'Toyota Camry',
    description: 'Vehicle model (required for drivers)',
    required: false,
    type: String,
  })
  @ValidateIf(o => o.role === 'driver')
  @IsOptional()
  @IsString()
  vehicleModel?: string;

 
  @ValidateIf(o => o.role === 'driver')
  @IsOptional()
  @ApiProperty({ example: [30.7068928,76.7688704] })
  @IsNotEmpty()
  readonly coordinates?: [number, number];
}