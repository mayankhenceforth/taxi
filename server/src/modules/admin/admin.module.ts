import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { JwtModule, JwtService } from '@nestjs/jwt';

@Module({
  imports:[
    
        JwtModule.register({ secret: process.env.JWT_SECRET }),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
