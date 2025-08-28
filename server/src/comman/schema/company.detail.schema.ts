// src/common/schema/company-details.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type CompanyDetailsDocument = CompanyDetails & Document;

@Schema({ timestamps: true })
export class CompanyAddress {
  @ApiProperty({
    description: 'Street address line 1',
    example: '123 Main Street',
  })
  @Prop({ required: true, trim: true })
  street: string;

  @ApiProperty({
    description: 'Street address line 2 (optional)',
    example: 'Suite 456',
    required: false,
  })
  @Prop({ trim: true })
  street2?: string;

  @ApiProperty({
    description: 'City',
    example: 'Mumbai',
  })
  @Prop({ required: true, trim: true })
  city: string;

  @ApiProperty({
    description: 'State/Province',
    example: 'Maharashtra',
  })
  @Prop({ required: true, trim: true })
  state: string;

  @ApiProperty({
    description: 'Postal/ZIP code',
    example: '400001',
  })
  @Prop({ required: true, trim: true })
  postalCode: string;

  @ApiProperty({
    description: 'Country',
    example: 'India',
  })
  @Prop({ required: true, trim: true, default: 'India' })
  country: string;

  @ApiProperty({
    description: 'Latitude coordinates for mapping',
    example: 19.0760,
    required: false,
  })
  @Prop()
  latitude?: number;

  @ApiProperty({
    description: 'Longitude coordinates for mapping',
    example: 72.8777,
    required: false,
  })
  @Prop()
  longitude?: number;
}

export const CompanyAddressSchema = SchemaFactory.createForClass(CompanyAddress);

@Schema({ timestamps: true })
export class CompanyContactNumber {
  @ApiProperty({
    description: 'Type of contact number',
    example: 'support',
    enum: ['support', 'sales', 'emergency', 'admin', 'billing', 'other'],
  })
  @Prop({
    required: true,
    enum: ['support', 'sales', 'emergency', 'admin', 'billing', 'other'],
  })
  type: string;

  @ApiProperty({
    description: 'Contact number',
    example: '+91-1234567890',
  })
  @Prop({ required: true, trim: true })
  number: string;

  @ApiProperty({
    description: 'Is this the primary contact number for this type?',
    example: true,
    default: false,
  })
  @Prop({ default: false })
  isPrimary: boolean;

  @ApiProperty({
    description: 'Additional notes about this contact number',
    example: 'Available 24/7',
    required: false,
  })
  @Prop()
  notes?: string;
}

export const CompanyContactNumberSchema = SchemaFactory.createForClass(CompanyContactNumber);

@Schema({ timestamps: true })
export class CompanySocialMedia {
  @ApiProperty({
    description: 'Social media platform name',
    example: 'facebook',
    enum: ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'whatsapp', 'other'],
  })
  @Prop({
    required: true,
    enum: ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'whatsapp', 'other'],
  })
  platform: string;

  @ApiProperty({
    description: 'Social media profile URL',
    example: 'https://facebook.com/companyname',
  })
  @Prop({ required: true, trim: true })
  url: string;

  @ApiProperty({
    description: 'Social media handle/username',
    example: '@companyname',
    required: false,
  })
  @Prop({ trim: true })
  handle?: string;
}

export const CompanySocialMediaSchema = SchemaFactory.createForClass(CompanySocialMedia);

@Schema({ timestamps: true })
export class CompanyDetails {
  @ApiProperty({
    description: 'Unique identifier for the company details document',
    example: '507f1f77bcf86cd799439011',
  })
  _id: Types.ObjectId;

  @ApiProperty({
    description: 'Company legal name',
    example: 'RideShare Technologies Pvt. Ltd.',
  })
  @Prop({ required: true, trim: true, unique: true })
  companyName: string;

  @ApiProperty({
    description: 'Company trade name (DBA)',
    example: 'RideShare',
    required: false,
  })
  @Prop({ trim: true })
  tradingName?: string;

  @ApiProperty({
    description: 'Company logo URL',
    example: 'https://cloudinary.com/company-logo.png',
    required: false,
  })
  @Prop()
  logo?: string;

  @ApiProperty({
    description: 'Company favicon URL',
    example: 'https://cloudinary.com/favicon.ico',
    required: false,
  })
  @Prop()
  favicon?: string;

  @ApiProperty({
    description: 'Company tagline or slogan',
    example: 'Your Ride, Your Way',
    required: false,
  })
  @Prop({ trim: true })
  tagline?: string;

  @ApiProperty({
    description: 'Brief company description',
    example: 'Leading ride-sharing platform connecting drivers and riders across India.',
    required: false,
  })
  @Prop({ trim: true })
  description?: string;

  @ApiProperty({
    description: 'Company GST number',
    example: '27ABCDE1234F1Z5',
    required: false,
  })
  @Prop({ trim: true, uppercase: true })
  gstNumber?: string;

  @ApiProperty({
    description: 'Company CIN (Corporate Identification Number)',
    example: 'U74999MH2019PTC123456',
    required: false,
  })
  @Prop({ trim: true, uppercase: true })
  cinNumber?: string;

  @ApiProperty({
    description: 'Company PAN number',
    example: 'ABCDE1234F',
    required: false,
  })
  @Prop({ trim: true, uppercase: true })
  panNumber?: string;

  @ApiProperty({
    description: 'Primary company email address',
    example: 'info@rideshare.com',
  })
  @Prop({ required: true, trim: true, lowercase: true })
  email: string;

  @ApiProperty({
    description: 'Additional email addresses',
    example: ['support@rideshare.com', 'careers@rideshare.com'],
    required: false,
  })
  @Prop([{ type: String, trim: true, lowercase: true }])
  additionalEmails?: string[];

  @ApiProperty({
    description: 'Company website URL',
    example: 'https://rideshare.com',
  })
  @Prop({ required: true, trim: true })
  website: string;

  @ApiProperty({
    description: 'Company contact numbers',
    type: [CompanyContactNumber],
  })
  @Prop({ type: [CompanyContactNumberSchema], default: [] })
  contactNumbers: CompanyContactNumber[];

  @ApiProperty({
    description: 'Company physical address',
    type: CompanyAddress,
  })
  @Prop({ type: CompanyAddressSchema, required: true })
  address: CompanyAddress;

  @ApiProperty({
    description: 'Additional company addresses (branches, offices, etc.)',
    type: [CompanyAddress],
    required: false,
  })
  @Prop({ type: [CompanyAddressSchema], default: [] })
  additionalAddresses?: CompanyAddress[];

  @ApiProperty({
    description: 'Company social media profiles',
    type: [CompanySocialMedia],
    required: false,
  })
  @Prop({ type: [CompanySocialMediaSchema], default: [] })
  socialMedia?: CompanySocialMedia[];

  @ApiProperty({
    description: 'Company operating hours',
    example: { 
      mondayToFriday: '9:00 AM - 6:00 PM', 
      saturday: '10:00 AM - 4:00 PM', 
      sunday: 'Closed' 
    },
    required: false,
  })
  @Prop({ type: Map, of: String })
  operatingHours?: Map<string, string>;

  @ApiProperty({
    description: 'Company founding date',
    example: '2020-01-15',
    required: false,
  })
  @Prop()
  foundedDate?: Date;

  @ApiProperty({
    description: 'Company registration date',
    example: '2020-01-20',
    required: false,
  })
  @Prop()
  registrationDate?: Date;

  @ApiProperty({
    description: 'Company terms and conditions URL',
    example: 'https://rideshare.com/terms',
    required: false,
  })
  @Prop()
  termsUrl?: string;

  @ApiProperty({
    description: 'Company privacy policy URL',
    example: 'https://rideshare.com/privacy',
    required: false,
  })
  @Prop()
  privacyPolicyUrl?: string;

  @ApiProperty({
    description: 'Company refund policy URL',
    example: 'https://rideshare.com/refund-policy',
    required: false,
  })
  @Prop()
  refundPolicyUrl?: string;

  @ApiProperty({
    description: 'Company copyright information',
    example: '© 2024 RideShare Technologies. All rights reserved.',
    required: false,
  })
  @Prop()
  copyright?: string;

  @ApiProperty({
    description: 'Company version information',
    example: 'v2.1.0',
    required: false,
  })
  @Prop()
  version?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

export const CompanyDetailsSchema = SchemaFactory.createForClass(CompanyDetails);

// Ensure only one company details document exists
CompanyDetailsSchema.index({}, { unique: true });