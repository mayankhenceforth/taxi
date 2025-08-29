import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { CommonModule } from './comman/comman.module';
import { DatabaseModule } from './comman/db/db.module';
import { GuardModule } from './comman/guards/guads.module';

import { UserModule } from './modules/user/user.module';
import { AdminModule } from './modules/admin/admin.module';
import { DriverModule } from './modules/driver/driver.module';
import { RideModule } from './modules/ride/ride.module';

import { CloudinaryModule } from './comman/cloudinary/cloudinary.module';
import { SmsModule } from './comman/sms/sms.module';
import { PaymentModule } from './comman/payment/payment.module';
import { InvoiceModule } from './comman/invoice/invoice.module';
import ConfigureDB from './comman/db/db';
import { MailModule } from './comman/mail/mail.module';
import { otpModule } from './comman/otp/otp.module';
import { TokenModule } from './comman/token/token.module';
import { CompanyModule } from './modules/company/company.module';
import { JwtModule } from '@nestjs/jwt';
import { CustomerSupportModule } from './modules/customer-support/customer-support.module';

@Module({
  imports: [
    JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            secret: config.get<string>('ACCESS_TOKEN_SECRET'),
            signOptions: { expiresIn: '1d' },
          }),
        }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    ScheduleModule.forRoot(),
    ConfigureDB(),
    DatabaseModule, // globally shared schemas
    CommonModule,
    GuardModule,

    // Feature Modules
    UserModule,
    AdminModule,
    DriverModule,
    RideModule,
    CompanyModule,
    CustomerSupportModule,

    // Common Functional Modules
    CloudinaryModule,
    SmsModule,
    PaymentModule,
    InvoiceModule,
    MailModule,
    GuardModule,
    otpModule,
    TokenModule
  ],
})
export class AppModule {}





