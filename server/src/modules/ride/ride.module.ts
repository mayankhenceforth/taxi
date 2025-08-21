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
import { PaymentModule } from 'src/comman/payment/payment.module';
import { PaymentService } from 'src/comman/payment/payment.service';
import { InvoiceModule } from 'src/comman/invoice/invoice.module';
import { CloudinaryModule } from 'src/comman/cloudinary/cloudinary.module';
import { CloudinaryService } from 'src/comman/cloudinary/cloudinary.service';

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
    PaymentModule,
    InvoiceModule,
    CloudinaryModule
  ],
  controllers: [RideController],
  providers: [RideService, RideGateway,PaymentService, AuthGuards, RoleGuards, RideCronService,CloudinaryService],
})
export class RideModule { }
