import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';

import { TokenModule } from 'src/comman/token/token.module';
import { CloudinaryModule } from 'src/comman/cloudinary/cloudinary.module';
import { SmsModule } from 'src/comman/sms/sms.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/comman/schema/user.schema';
import { DatabaseModule } from 'src/comman/db/db.module';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    TokenModule,
    CloudinaryModule,
    SmsModule,
    ConfigModule,
    DatabaseModule
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
