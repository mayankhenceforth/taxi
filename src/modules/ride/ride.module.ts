import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Ride, RideSchema, TemporaryRide, TemporaryRideSchema } from 'src/comman/schema/ride.schema';
import { User, UserSchema } from 'src/comman/schema/user.schema';
import { RideService } from './ride.service';
import { RideController } from './ride.controller';
import { RideGateway } from './ride.gateway';
import { AuthGuards } from 'src/comman/guards/auth.guards';
import { RoleGuards } from 'src/comman/guards/role.guards';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RideCronService } from './ride.cron.service';

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
      { name: Ride.name, schema: RideSchema },
      { name: User.name, schema: UserSchema },
        { name: TemporaryRide.name, schema: TemporaryRideSchema }
    ]),
  ],
  controllers: [RideController],
  providers: [RideService, RideGateway, AuthGuards, RoleGuards,RideCronService],
})
export class RideModule {}
