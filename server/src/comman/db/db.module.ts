import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DriverLicense,
  DriverLicenseSchema,
  User,
  UserSchema,
  VehicleDetails,
  vehicleDetailsSchema
} from '../schema/user.schema';
import {
  Ride,
  RideSchema,
  TemporaryRide,
  TemporaryRideSchema
} from '../schema/ride.schema';
import {
  DriverPayout,
  DriverPayoutSchema
} from '../schema/payout.schema';
import { RideRating, RideRatingSchema } from '../schema/rating.schma';
import { Payment, PaymentSchema } from '../schema/payment.schema';
import { DriverEarning, DriverEarningSchema } from '../schema/driver-earnings.schema';
import { DriverPayment, DriverPaymentSchema } from '../schema/DriverPaymentInfo.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: VehicleDetails.name, schema: vehicleDetailsSchema },
      { name: Ride.name, schema: RideSchema },
      { name: TemporaryRide.name, schema: TemporaryRideSchema },
      { name: DriverPayout.name, schema: DriverPayoutSchema },
      { name: DriverEarning.name, schema: DriverEarningSchema },
      {name:RideRating.name ,schema :RideRatingSchema},
      {name:DriverLicense.name ,schema:DriverLicenseSchema},
      {name:Payment.name ,schema:PaymentSchema},
      {name:DriverPayment.name ,schema :DriverPaymentSchema}
    ])
  ],
  exports: [MongooseModule]
})
export class DatabaseModule {}




