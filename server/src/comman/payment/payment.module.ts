import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Ride, RideSchema } from '../schema/ride.schema';
import { PaymentController } from './payment.controller';
import { InvoiceModule } from '../invoice/invoice.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { PaymentCronService } from './payment.cron.service';

@Module({
  imports: [  MongooseModule.forFeature([{ name: Ride.name, schema: RideSchema }]),InvoiceModule,
CloudinaryModule],
  controllers: [PaymentController],
  providers: [PaymentService,],
  exports : [PaymentService]
})
export class PaymentModule {}
