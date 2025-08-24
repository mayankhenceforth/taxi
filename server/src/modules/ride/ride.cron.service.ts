// src/modules/ride/ride-cron.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ride, RideDocument, TemporaryRide, TemporaryRideDocument } from 'src/comman/schema/ride.schema';


@Injectable()
export class RideCronService {
  private readonly logger = new Logger(RideCronService.name);

  constructor(
    @InjectModel(TemporaryRide.name)
    private tempRideModel: Model<TemporaryRideDocument>,

    @InjectModel(Ride.name)
    private rideModel: Model<RideDocument>,
  ) { }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async checkPendingRides() {
    const now = new Date();

    const ridesPendingDriver = await this.tempRideModel.find({
      createdAt: { $lte: new Date(now.getTime() - 30 * 1000) }, // 30 seconds
    });

    for (const ride of ridesPendingDriver) {
      this.logger.log(
        `Ride ${ride._id} has no driver after 30 seconds.`,
      );
    }
    const ridesToTerminate = await this.tempRideModel.find({
      createdAt: { $lte: new Date(now.getTime() - 6 * 60 * 1000) }, // 3 minutes
    });

    for (const ride of ridesToTerminate) {
      this.logger.log(
        `Terminating ride ${ride._id} due to no driver response in 3 minutes.`,
      );

      await this.rideModel.findByIdAndUpdate(ride._id, {
        status: 'terminated',
      });
      await this.tempRideModel.findByIdAndDelete(ride._id);
      console.log(`Terminating ride ${ride._id} due to no driver response in 3 minutes.`);
    }

  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkRideStart() {
    const now = new Date();
    const ridesToStart = await this.rideModel.find({
      status: 'accepted',
      updatedAt: { $lte: new Date(now.getTime() - 30* 60 * 1000) },
    }).populate('driver bookedBy');
    
    if (ridesToStart.length === 0) {
      this.logger.log(`No rides to start after 1 minutes of acceptance.`);
      return;
    }
    this.logger.log(`Checking for rides to start after 1 minutes of acceptance...`);
    for (const ride of ridesToStart) {
      this.logger.log(
        `Ride ${ride._id} is accepted but not started after 1 minutes.`,
      )
      await this.rideModel.findByIdAndUpdate(ride._id, {
        status: 'started',

      })
      this.logger.log(`Ride ${ride._id} status updated to started.`);

      console.log(`Ride ${ride._id} status updated to started.`);
    }
  }
}
