import { BadRequestException, Injectable, UnauthorizedException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SetupDriverAccountDto } from './dto/SetupDriverAccount.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, VehicleDetails, VehicleDetailsDocument } from 'src/comman/schema/user.schema';
import { Model, Types } from 'mongoose';
import { CreateDriverPayoutDto } from './dto/CreatePaymentAccount.dto';
import { DriverPayout, DriverPayoutDocument } from 'src/comman/schema/payout.schema';
import { DriverEarning, DriverEarningDocument, EarningsStatus } from 'src/comman/schema/driver-earnings.schema';
import { DriverPayment, DriverPaymentDocument } from 'src/comman/schema/DriverPaymentInfo.schema';
import { Ride, RideDocument } from 'src/comman/schema/ride.schema';

@Injectable()
export class DriverService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(VehicleDetails.name) private readonly vehicleDetailsModel: Model<VehicleDetailsDocument>,
    @InjectModel(DriverPayout.name) private readonly driverPayoutModel: Model<DriverPayoutDocument>,
    @InjectModel(DriverEarning.name) private readonly earningModel: Model<DriverEarningDocument>,
    @InjectModel(DriverPayment.name) private  driverPaymentModel: Model<DriverPaymentDocument>,
    @InjectModel(Ride.name) private readonly rideModel:Model<RideDocument>,
     @InjectModel(DriverEarning.name) private readonly driverEarningModel:Model<DriverEarningDocument>,
  ) { }

  /** Setup driver account with vehicle and initial earnings */
  async setupDriverAccount(req: any, setupDriverAccountDto: SetupDriverAccountDto) {
    const driverId = req.user?._id;
    const driver = await this.userModel.findOne({ _id: driverId, role: 'driver' })
      .select("name _id contactNumber role createdAt profilePic");

    if (!driver) throw new UnauthorizedException('Driver not found!');

    const { coordinates, vehicleInfo } = setupDriverAccountDto;

    if (!coordinates || coordinates.length !== 2) throw new BadRequestException('Coordinates required!');
    if (!vehicleInfo?.type || !vehicleInfo?.numberPlate || !vehicleInfo?.model) throw new BadRequestException('Vehicle info required!');

    const session = await this.userModel.db.startSession();
    session.startTransaction();

    try {
      // Remove old vehicle
      if (driver.vehicleDetails) await this.vehicleDetailsModel.findByIdAndDelete(driver.vehicleDetails, { session });

      const newVehicleDetails = await this.vehicleDetailsModel.create([{
        type: vehicleInfo.type.toLowerCase(),
        numberPlate: vehicleInfo.numberPlate.toLowerCase(),
        model: vehicleInfo.model.toLowerCase(),
      }], { session });

      // Create initial earning document
      const newEarning = await this.earningModel.create([{
        driverId,
        rideId: null, // no ride yet
        userId: null,
        paymentId: null,
        amount: 0,
        status: EarningsStatus.PROCESSED,
      }], { session });

      // Update driver
      const updatedDriver = await this.userModel.findByIdAndUpdate(driverId, {
        location: { type: 'Point', coordinates },
        vehicleDetails: newVehicleDetails[0]._id,
        earnings: newEarning[0]._id,
      }, { new: true, session })
        .populate('vehicleDetails earnings')
        .select('location vehicleDetails earnings name email contactNumber profilePic role');

      await session.commitTransaction();
      session.endSession();

      return { message: "Driver setup successfully", data: updatedDriver };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw new InternalServerErrorException('Failed to setup driver account: ' + error.message);
    }
  }

  /** Create Driver Payout Account */
  async createPaymentAccount(req: any, dto: CreateDriverPayoutDto) {
    const driverId = req.user?._id;
    const driver = await this.userModel.findOne({ _id: driverId, role: 'driver' });
    if (!driver) throw new UnauthorizedException('Driver not found!');

    if (!dto.method || !dto.accountNumber || !dto.accountHolderName) throw new BadRequestException('Required fields missing!');
    if (dto.method === 'bank' && !dto.ifsc) throw new BadRequestException('IFSC required for bank payout.');

    if (dto.isDefault) {
      await this.driverPayoutModel.updateMany({ driverId, isDefault: true }, { isDefault: false });
    }

    const payout =await new this.driverPayoutModel({
      driverId,
      method: dto.method,
      accountNumber: dto.accountNumber,
      ifsc: dto.ifsc || null,
      accountHolderName: dto.accountHolderName,
      nickname: dto.nickname || null,
      isDefault: dto.isDefault || false,
      isActive: true,
    });
    await payout.save();



    if (!Array.isArray(driver.payoutAccounts)) {
      driver.payoutAccounts = [];
    }

    const driverPaymentInfo =await new this.driverPaymentModel({
      driverId,
      payoutMethod:payout._id
    })
    await driverPaymentInfo.save()

    driver.payoutAccounts.push(payout._id as Types.ObjectId);
    await driver.save();
    return { success: true, message: 'Driver payout account created', data: payout };
  }

  /** Record Driver Earnings for a ride */
  async recordDriverEarning(
    rideId: string,
    driverId: Types.ObjectId,
    userId: Types.ObjectId,
    paymentId: Types.ObjectId | string,
    amount: number,
    rideStatus:string
  ) {
    const earning = await this.earningModel.create({
      rideId,
      driverId,
      userId,
      paymentId,
      amount,
      status: EarningsStatus.PAID,
      rideStatus
    });
    return earning;
  }


   async payDriver(driverId: string, rides: RideDocument[], payoutDetails: any) {
    const totalEarnings = rides.reduce((sum, r) => sum + (r.driverEarnings || 0), 0);

    // Update driver payment record
    const driverPayment = await this.driverPaymentModel.findOneAndUpdate(
      { driverId },
      {
        $set: {
          payoutMethod: payoutDetails.method,
          payoutAccount: payoutDetails.accountNumber,
          status: 'paid',
          lastPayoutAmount: totalEarnings,
          lastPayoutDate: new Date(),
          payoutTransactionId: new Types.ObjectId().toHexString(),
          remarks: 'Payout processed successfully',
        },
        $inc: { totalEarnings },
      },
      { upsert: true, new: true },
    );

    // Update rides and earnings as paid
    await this.driverEarningModel.updateMany(
      { driverId, driverPaymentStatus: 'unpaid' },
      { $set: { driverPaymentStatus: 'paid', updatedAt: new Date() } },
    );

    await this.rideModel.updateMany(
      { _id: { $in: rides.map(r => r._id) } },
      { $set: { driverPaymentStatus: 'paid' } },
    );

    return driverPayment;
  }


  /** Fetch driver earnings history with pagination */
  async getDriverEarningsHistory(req: any, page = 1, limit = 10) {
    const driverId = req.user?._id;
    if (!driverId) throw new UnauthorizedException('Driver not authenticated');

    const skip = (page - 1) * limit;
    const earnings = await this.earningModel
      .find({ driverId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('rideId', 'pickupLocation dropoffLocation TotalFare status');

    const total = await this.earningModel.countDocuments({ driverId });

    return {
      success: true,
      message: 'Earnings history retrieved successfully',
      data: {
        earnings,
        pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total, itemsPerPage: limit },
      },
    };
  }

  /** Fetch total earnings summary for a driver */
  async getDriverEarnings(req: any) {
    const driverId = req.user?._id;
    if (!driverId) throw new UnauthorizedException('Driver not authenticated');

    const earnings = await this.earningModel.aggregate([
      { $match: { driverId: driverId } },
      { $group: { _id: '$driverId', totalAmount: { $sum: '$amount' }, totalRides: { $sum: 1 } } },
    ]);

    return {
      success: true,
      message: 'Driver earnings summary',
      data: earnings[0] || { totalAmount: 0, totalRides: 0 },
    };
  }
}
