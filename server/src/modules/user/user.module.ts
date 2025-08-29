import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';

import { TokenModule } from 'src/comman/token/token.module';
import { CloudinaryModule } from 'src/comman/cloudinary/cloudinary.module';
import { SmsModule } from 'src/comman/sms/sms.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/comman/schema/user.schema';
import { DatabaseModule } from 'src/comman/db/db.module';
import { JwtModule } from '@nestjs/jwt';


@Module({
  imports: [
    // MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('ACCESS_TOKEN_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
    TokenModule,
    CloudinaryModule,
    SmsModule,
    ConfigModule,
    DatabaseModule,

  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule { }
