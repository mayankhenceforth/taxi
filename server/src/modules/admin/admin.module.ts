import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Ride, RideSchema, TemporaryRide, TemporaryRideSchema } from 'src/comman/schema/ride.schema';
import { User, UserSchema } from 'src/comman/schema/user.schema';

@Module({
  imports:[
    
        JwtModule.register({ secret: process.env.JWT_SECRET }),
        MongooseModule.forFeature([
              { name: Ride.name, schema: RideSchema },
              { name: User.name, schema: UserSchema },
              { name: TemporaryRide.name, schema: TemporaryRideSchema }
            ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
