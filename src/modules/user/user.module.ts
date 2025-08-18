import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TokenModule } from 'src/comman/token/token.module';
import { CloudinaryModule } from 'src/comman/cloudinary/cloudinary.module';
import { SmsModule } from 'src/comman/sms/sms.module';

@Module({
  imports:[TokenModule,CloudinaryModule,SmsModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
