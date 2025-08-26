import { Module } from '@nestjs/common';
import { RideController } from './ride.controller';
import { RideService } from './ride.service';
import { RideGateway } from './ride.gateway';
import { RideCronService } from './ride.cron.service';

import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { DriverModule } from '../driver/driver.module';
import { InvoiceModule } from 'src/comman/invoice/invoice.module';
import { CloudinaryModule } from 'src/comman/cloudinary/cloudinary.module';
import { PaymentModule } from 'src/comman/payment/payment.module';
import { MailModule } from 'src/comman/mail/mail.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('ACCESS_TOKEN_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
    DriverModule,
    InvoiceModule,
    CloudinaryModule,
    PaymentModule,
    MailModule,
  ],
  controllers: [RideController],
  providers: [
    RideService,
    RideGateway,
    RideCronService,
  ],
})
export class RideModule {}
