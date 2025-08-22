import { Module } from '@nestjs/common';
import { DriverService } from './driver.service';
import { DriverController } from './driver.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuards } from '../../comman/guards/auth.guards';
import { User, UserSchema, VehicleDetails, vehicleDetailsSchema } from 'src/comman/schema/user.schema';
import { DriverPayout, DriverPayoutSchema } from 'src/comman/schema/payout.schema';
import { DriverEarnings, DriverEarningsSchema } from 'src/comman/schema/driver-earnings.schema';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('ACCESS_TOKEN_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: VehicleDetails.name, schema: vehicleDetailsSchema },
      { name: DriverPayout.name, schema: DriverPayoutSchema },
      { name: DriverEarnings.name, schema: DriverEarningsSchema }
    ])
  ],
  controllers: [DriverController],
  providers: [DriverService, AuthGuards, DriverService],
  exports: [DriverService],
})
export class DriverModule { }
