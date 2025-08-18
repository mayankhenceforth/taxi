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
  ) {}

  // Runs every 10 seconds to check rides
  @Cron(CronExpression.EVERY_10_SECONDS)
  async checkPendingRides() {
    const now = new Date();

    // 1. Find rides older than 30 seconds with no driver assigned
    const ridesPendingDriver = await this.tempRideModel.find({
      createdAt: { $lte: new Date(now.getTime() - 30 * 1000) }, // 30 seconds
    });

    for (const ride of ridesPendingDriver) {
      this.logger.log(
        `Ride ${ride._id} has no driver after 30 seconds.`,
      );
      // Optionally, notify user or driver here
    }

    // 2. Find rides older than 3 minutes to terminate
    const ridesToTerminate = await this.tempRideModel.find({
      createdAt: { $lte: new Date(now.getTime() - 3 * 60 * 1000) }, // 3 minutes
    });

    for (const ride of ridesToTerminate) {
      this.logger.log(
        `Terminating ride ${ride._id} due to no driver response in 3 minutes.`,
      );

      // Mark ride as terminated in Ride collection
      await this.rideModel.findByIdAndUpdate(ride._id, {
        status: 'terminated',
      });

      // Delete temporary ride
      await this.tempRideModel.findByIdAndDelete(ride._id);

      // Optionally, notify user about termination
    }
  }
}
