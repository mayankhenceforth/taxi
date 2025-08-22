import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Ride, RideSchema, TemporaryRide, TemporaryRideSchema } from 'src/comman/schema/ride.schema';
import { User, UserSchema, VehicleDetails, vehicleDetailsSchema } from 'src/comman/schema/user.schema';
import { RideService } from './ride.service';
import { RideController } from './ride.controller';
import { RideGateway } from './ride.gateway';
import { AuthGuards } from 'src/comman/guards/auth.guards';
import { RoleGuards } from 'src/comman/guards/role.guards';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RideCronService } from './ride.cron.service';
import { PaymentModule } from 'src/comman/payment/payment.module';
import { PaymentService } from 'src/comman/payment/payment.service';
import { InvoiceModule } from 'src/comman/invoice/invoice.module';
import { CloudinaryModule } from 'src/comman/cloudinary/cloudinary.module';
import { CloudinaryService } from 'src/comman/cloudinary/cloudinary.service';
import { DriverModule } from '../driver/driver.module';
import { DriverService } from '../driver/driver.service';
import { DriverEarnings, DriverEarningsSchema } from 'src/comman/schema/driver-earnings.schema';
import { DriverPayout, DriverPayoutSchema } from 'src/comman/schema/payout.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ride.name, schema: RideSchema },
      { name: TemporaryRide.name, schema: TemporaryRideSchema },
      { name: User.name, schema: UserSchema },
      { name: VehicleDetails.name, schema: vehicleDetailsSchema },
      { name: DriverPayout.name, schema: DriverPayoutSchema },
      { name: DriverEarnings.name, schema: DriverEarningsSchema },
    ]),
    DriverModule
  ],
  controllers: [RideController],
  providers: [RideService, RideGateway,PaymentService, AuthGuards, RoleGuards, RideCronService,CloudinaryService,DriverService],
})
export class RideModule { }
