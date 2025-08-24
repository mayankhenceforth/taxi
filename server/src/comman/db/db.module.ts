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
import {
  DriverEarnings,
  DriverEarningsSchema
} from '../schema/driver-earnings.schema';
import { RideRating, RideRatingSchema } from '../schema/rating.schma';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: VehicleDetails.name, schema: vehicleDetailsSchema },
      { name: Ride.name, schema: RideSchema },
      { name: TemporaryRide.name, schema: TemporaryRideSchema },
      { name: DriverPayout.name, schema: DriverPayoutSchema },
      { name: DriverEarnings.name, schema: DriverEarningsSchema },
      {name:RideRating.name ,schema :RideRatingSchema},
      {name:DriverLicense.name ,schema:DriverLicenseSchema}
    ])
  ],
  exports: [MongooseModule]
})
export class DatabaseModule {}




