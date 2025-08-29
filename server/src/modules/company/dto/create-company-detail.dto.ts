import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsEmail, 
  IsUrl, 
  IsArray, 
  IsOptional, 
  ValidateNested, 
  IsObject, 
  IsDateString, 
  IsEnum,
  IsBoolean,
  IsNumber,
  IsNotEmpty
} from 'class-validator';
import { Type } from 'class-transformer';

export class CompanyAddressDto {
  @ApiProperty({ example: '123 Main Street' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: 'Suite 456', required: false })
  @IsString()
  @IsOptional()
  street2?: string;

  @ApiProperty({ example: 'Mumbai' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Maharashtra' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: '400001' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiProperty({ example: 'India', default: 'India' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ example: 19.0760, required: false })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({ example: 72.8777, required: false })
  @IsNumber()
  @IsOptional()
  longitude?: number;
}

export class CompanyContactNumberDto {
  @ApiProperty({ 
    example: 'support', 
    enum: ['support', 'sales', 'emergency', 'admin', 'billing', 'other'] 
  })
  @IsEnum(['support', 'sales', 'emergency', 'admin', 'billing', 'other'])
  type: string;

  @ApiProperty({ example: '+91-1234567890' })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiProperty({ example: true, default: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiProperty({ example: 'Available 24/7', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CompanySocialMediaDto {
  @ApiProperty({ 
    example: 'facebook', 
    enum: ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'whatsapp', 'other'] 
  })
  @IsEnum(['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'whatsapp', 'other'])
  platform: string;

  @ApiProperty({ example: 'https://facebook.com/companyname' })
  @IsUrl()
  url: string;

  @ApiProperty({ example: '@companyname', required: false })
  @IsString()
  @IsOptional()
  handle?: string;
}

export class CreateCompanyDetailsDto {
  @ApiProperty({ example: 'RideShare Technologies Pvt. Ltd.' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ example: 'RideShare', required: false })
  @IsString()
  @IsOptional()
  tradingName?: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/dmedhsl41/image/upload/v1755751596/360_F_471467270_wdaTtaF6QWhqILrY0LGUZvpIXOtVEgGP-removebg-preview_g3rsyw.png', required: false })
  @IsUrl()
  @IsOptional()
  logo?: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/dmedhsl41/image/upload/v1755751596/360_F_471467270_wdaTtaF6QWhqILrY0LGUZvpIXOtVEgGP-removebg-preview_g3rsyw.png', required: false })
  @IsUrl()
  @IsOptional()
  favicon?: string;

  @ApiProperty({ example: 'Your Ride, Your Way', required: false })
  @IsString()
  @IsOptional()
  tagline?: string;

  @ApiProperty({ example: 'Leading ride-sharing platform...', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '27ABCDE1234F1Z5', required: false })
  @IsString()
  @IsOptional()
  gstNumber?: string;

  @ApiProperty({ example: 'U74999MH2019PTC123456', required: false })
  @IsString()
  @IsOptional()
  cinNumber?: string;

  @ApiProperty({ example: 'ABCDE1234F', required: false })
  @IsString()
  @IsOptional()
  panNumber?: string;

  @ApiProperty({ example: 'info@rideshare.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: ['support@rideshare.com'], required: false })
  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  additionalEmails?: string[];

  @ApiProperty({ example: 'https://rideshare.com' })
  @IsUrl()
  website: string;

  @ApiProperty({ type: [CompanyContactNumberDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompanyContactNumberDto)
  contactNumbers: CompanyContactNumberDto[];

  @ApiProperty({ type: CompanyAddressDto })
  @ValidateNested()
  @Type(() => CompanyAddressDto)
  address: CompanyAddressDto;

  @ApiProperty({ type: [CompanyAddressDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompanyAddressDto)
  @IsOptional()
  additionalAddresses?: CompanyAddressDto[];

  @ApiProperty({ type: [CompanySocialMediaDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompanySocialMediaDto)
  @IsOptional()
  socialMedia?: CompanySocialMediaDto[];

  @ApiProperty({ 
    example: { 
      mondayToFriday: '9:00 AM - 6:00 PM', 
      saturday: '10:00 AM - 4:00 PM' 
    }, 
    required: false 
  })
  @IsObject()
  @IsOptional()
  operatingHours?: Record<string, string>;

  @ApiProperty({ example: '2020-01-15', required: false })
  @IsDateString()
  @IsOptional()
  foundedDate?: string;

  @ApiProperty({ example: '2020-01-20', required: false })
  @IsDateString()
  @IsOptional()
  registrationDate?: string;

  @ApiProperty({ example: 'https://rideshare.com/terms', required: false })
  @IsUrl()
  @IsOptional()
  termsUrl?: string;

  @ApiProperty({ example: 'https://rideshare.com/privacy', required: false })
  @IsUrl()
  @IsOptional()
  privacyPolicyUrl?: string;

  @ApiProperty({ example: 'https://rideshare.com/refund-policy', required: false })
  @IsUrl()
  @IsOptional()
  refundPolicyUrl?: string;

  @ApiProperty({ example: '© 2024 RideShare Technologies', required: false })
  @IsString()
  @IsOptional()
  copyright?: string;

  @ApiProperty({ example: 'v2.1.0', required: false })
  @IsString()
  @IsOptional()
  version?: string;
}