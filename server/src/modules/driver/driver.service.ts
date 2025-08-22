import { BadRequestException, Injectable, UnauthorizedException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SetupDriverAccountDto } from './dto/SetupDriverAccount.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, VehicleDetails, VehicleDetailsDocument } from 'src/comman/schema/user.schema';
import { Model, Types } from 'mongoose';
import { CreateDriverPayoutDto } from './dto/CreatePaymentAccount.dto';
import { DriverPayout, DriverPayoutDocument } from 'src/comman/schema/payout.schema';
import { DriverEarnings, DriverEarningsDocument, EarningsType, EarningsStatus } from 'src/comman/schema/driver-earnings.schema';

@Injectable()
export class DriverService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(VehicleDetails.name) private readonly vehicleDetailsModel: Model<VehicleDetailsDocument>,
    @InjectModel(DriverPayout.name) private readonly DriverPayOutModel: Model<DriverPayoutDocument>,
    @InjectModel(DriverEarnings.name) private readonly earningModel: Model<DriverEarningsDocument>,
  ) {}

  async setupDriverAccount(req: any, setupDriverAccountDto: SetupDriverAccountDto) {
    const driverId = req.user?._id;
    const driver = await this.userModel.findOne({
      _id: driverId,
      role: 'driver',
    }).select("name _id contactNumber role createdAt profilePic");

    if (!driver) {
      throw new UnauthorizedException('Driver not found!');
    }

    const { coordinates, vehicleInfo } = setupDriverAccountDto;

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      throw new BadRequestException('Coordinates are required!');
    }

    if (!vehicleInfo || !vehicleInfo?.type || !vehicleInfo?.numberPlate || !vehicleInfo?.model) {
      throw new BadRequestException('Vehicle info is required!');
    }

    const session = await this.userModel.db.startSession();
    session.startTransaction();

    try {
      if (driver?.vehicleDetails) {
        await this.vehicleDetailsModel.findByIdAndDelete(driver.vehicleDetails, { session });
      }

      const newVehicleDetails = await this.vehicleDetailsModel.create([{
        type: vehicleInfo.type.toLowerCase(),
        numberPlate: vehicleInfo.numberPlate.toLowerCase(),
        model: vehicleInfo.model.toLowerCase(),
      }], { session });

      let earningsDoc = await this.earningModel.findOne({ driverId }).session(session);
      
      if (!earningsDoc) {
        const newEarnings = await this.earningModel.create([{
          driverId,
          type: EarningsType.RIDE,
          amount: 0,
          description: 'Initial earnings document',
          status: EarningsStatus.PROCESSED,
          totalEarnings: 0,
          totalRides: 0,
          availableBalance: 0,
          paidBalance: 0,
        }], { session });
        earningsDoc = newEarnings[0];
      }

      const updatedDriverInfo = await this.userModel
        .findByIdAndUpdate(
          driverId,
          {
            $set: {
              location: {
                type: 'Point',
                coordinates,
              },
              vehicleDetails: newVehicleDetails[0]._id,
              earnings: earningsDoc._id,
            },
          },
          {
            new: true,
            session,
          },
        )
        .populate('vehicleDetails earnings')
        .select('location vehicleDetails earnings name email contactNumber isEmailVerified isContactNumberVerified profilePic role');

      await session.commitTransaction();
      session.endSession();

      return {
        message: "Driver setup successfully",
        data: updatedDriverInfo
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw new InternalServerErrorException('Failed to setup driver account: ' + error.message);
    }
  }

  async createPaymentAccount(
  req: any,
  createDriverPayoutDto: CreateDriverPayoutDto
) {
  const driverId = req.user?._id;

  const driver = await this.userModel.findOne({
    _id: driverId,
    role: 'driver',
  }).populate('vehicleDetails earnings');

  if (!driver) {
    throw new UnauthorizedException('Driver not found!');
  }

  const { method, accountNumber, ifsc, accountHolderName, nickname, isDefault } =
    createDriverPayoutDto;

  // Required fields check
  if (!method || !accountNumber || !accountHolderName) {
    throw new BadRequestException(
      'Method, account number, and account holder name are required!'
    );
  }

  // Extra validation for BANK
  if (method === 'bank' && !ifsc) {
    throw new BadRequestException(
      'IFSC code is required for BANK payout method.'
    );
  }

  // If new account is default, unset existing defaults
  if (isDefault) {
    await this.DriverPayOutModel.updateMany(
      { driverId, isDefault: true },
      { isDefault: false }
    );
  }

  // Create payout account
  const payoutAccount = new this.DriverPayOutModel({
    driverId,
    method,
    accountNumber,
    ifsc: ifsc || null,
    accountHolderName,
    nickname: nickname || null,
    isDefault: isDefault || false,
    isActive: true,
  });

  await payoutAccount.save();

  // ✅ Ensure payoutAccounts is an array and push new account
  if (!Array.isArray(driver.payoutAccounts)) {
    driver.payoutAccounts = [];
  }

  driver.payoutAccounts.push(payoutAccount._id as Types.ObjectId);
  await driver.save();

  return {
    success: true,
    message: 'Driver payout account created successfully',
    data: payoutAccount,
  };
}

  async updateDriverEarnings(rideId: Types.ObjectId, driverId: Types.ObjectId, amount: number) {
    const session = await this.earningModel.db.startSession();
    session.startTransaction();

    try {
      const earnings = await this.earningModel.findOne({ driverId }).session(session);
      
      if (!earnings) {
        throw new Error('Earnings document not found for driver');
      }

      earnings.totalEarnings += amount;
      earnings.availableBalance += amount;
      earnings.totalRides += 1;
      
      await earnings.save({ session });
      await session.commitTransaction();
      session.endSession();

      return earnings;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw new InternalServerErrorException('Failed to update driver earnings: ' + error.message);
    }
  }

  async getDriverEarnings(req: any) {
    const driverId = req.user?._id;
    
    if (!driverId) {
      throw new UnauthorizedException('Driver not authenticated');
    }

    const driver = await this.userModel.findById(driverId);
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    if (!driver.earnings) {
      throw new NotFoundException('Earnings record not found for this driver');
    }

    const earnings = await this.earningModel.findById(driver.earnings);
    if (!earnings) {
      throw new NotFoundException('Earnings details not found');
    }

    return {
      success: true,
      message: 'Driver earnings retrieved successfully',
      data: earnings
    };
  }

  async getDriverEarningsHistory(req: any, page: number = 1, limit: number = 10) {
    const driverId = req.user?._id;
    
    if (!driverId) {
      throw new UnauthorizedException('Driver not authenticated');
    }

    const skip = (page - 1) * limit;

    const earningsHistory = await this.earningModel
      .find({ driverId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('rideId', 'pickupLocation dropoffLocation fare status');

    const total = await this.earningModel.countDocuments({ driverId });

    return {
      success: true,
      message: 'Earnings history retrieved successfully',
      data: {
        earnings: earningsHistory,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    };
  }
}