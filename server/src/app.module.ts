import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './comman/comman.module';
import ConfigureDB from './comman/db/db';
import { UserModule } from './modules/user/user.module';
import { CloudinaryModule } from './comman/cloudinary/cloudinary.module';
import { AdminModule } from './modules/admin/admin.module';
import { DriverModule } from './modules/driver/driver.module';
import { SmsModule } from './comman/sms/sms.module';
import { AuthGuards } from './comman/guards/auth.guards';
import { RoleGuards } from './comman/guards/role.guards';
import { GuardModule } from './comman/guards/guads.module';
import { RideModule } from './modules/ride/ride.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PaymentModule } from './comman/payment/payment.module';
import { InvoiceModule } from './comman/invoice/invoice.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    ScheduleModule.forRoot(),
    CommonModule,
    ConfigureDB(),
    UserModule,
    CloudinaryModule,
    RideModule,
    AdminModule,
    DriverModule,
    SmsModule,
   GuardModule,
   PaymentModule,
   DriverModule,
   InvoiceModule
  
  ],

})
export class AppModule { }



