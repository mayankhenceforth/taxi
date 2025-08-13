import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './comman/comman.module';
import ConfigureDB from './comman/db/db';
import { UserModule } from './modules/user/user.module';
import { CloudinaryModule } from './comman/cloudinary/cloudinary.module';
import { TokenModule } from './comman/token/token.module';
import { RideModule } from './ride/ride.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    CommonModule,
    ConfigureDB(),
    UserModule, 
    CloudinaryModule, RideModule, 
    ],

})
export class AppModule { }
