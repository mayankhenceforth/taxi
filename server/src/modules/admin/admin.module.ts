import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Ride, RideSchema, TemporaryRide, TemporaryRideSchema } from 'src/comman/schema/ride.schema';
import { User, UserSchema } from 'src/comman/schema/user.schema';
import { CloudinaryModule } from 'src/comman/cloudinary/cloudinary.module';
import { InvoiceModule } from 'src/comman/invoice/invoice.module';
import { InvoiceService } from 'src/comman/invoice/invoice.service';
import Stripe from 'stripe';
import { PaymentModule } from 'src/comman/payment/payment.module';
import { PaymentService } from 'src/comman/payment/payment.service';

@Module({
  imports:[
    
        JwtModule.register({ secret: process.env.JWT_SECRET }),
        MongooseModule.forFeature([
              { name: Ride.name, schema: RideSchema },
              { name: User.name, schema: UserSchema },
              { name: TemporaryRide.name, schema: TemporaryRideSchema }
            ]),
            CloudinaryModule,
            InvoiceModule,
            PaymentModule
  ],
  controllers: [AdminController],
  providers: [AdminService,InvoiceService,PaymentService],
})
export class AdminModule {}
