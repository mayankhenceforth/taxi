import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { CloudinaryModule } from 'src/comman/cloudinary/cloudinary.module';
import { InvoiceModule } from 'src/comman/invoice/invoice.module';
import { PaymentModule } from 'src/comman/payment/payment.module';

import { InvoiceService } from 'src/comman/invoice/invoice.service';
import { PaymentService } from 'src/comman/payment/payment.service';
import { HtmlTemplateService } from 'src/comman/invoice/html-template.service';
import { PdfGeneratorService } from 'src/comman/invoice/pdf.service';
import { GeocodingService } from 'src/comman/invoice/geocoding.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
    CloudinaryModule,
    InvoiceModule,
    PaymentModule
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    InvoiceService,
    PaymentService,
    HtmlTemplateService,
    PdfGeneratorService,
    GeocodingService,
  ],
})
export class AdminModule {}
