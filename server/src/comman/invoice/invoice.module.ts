import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { Ride, RideSchema } from '../schema/ride.schema';
import { User, UserSchema } from '../schema/user.schema';
import { GeocodingService } from './geocoding.service';
import { HtmlTemplateService } from './html-template.service';
import { PdfGeneratorService } from './pdf.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ride.name, schema: RideSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [
    InvoiceService,
    HtmlTemplateService,
    PdfGeneratorService,
    GeocodingService,
  ],
  exports: [InvoiceService],
})
export class InvoiceModule {}
