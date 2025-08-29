// src/modules/ride/ride.service.ts
import {
  BadGatewayException,
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Ride, RideDocument, TemporaryRide, TemporaryRideDocument } from '../../comman/schema/ride.schema';
import mongoose, { Model, Mongoose, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Logger } from '@nestjs/common';
import ApiResponse from 'src/comman/helpers/api-response';
import { CreateRideDto } from './dto/create-ride.dto';
import { RideGateway } from './ride.gateway';
import { User, UserDocument } from 'src/comman/schema/user.schema';
import * as crypto from 'crypto';
import * as twilio from 'twilio';
import * as retry from 'async-retry';
import { Role } from 'src/comman/enums/role.enum';
import { VerifyRideOtpDto } from './dto/verify-ride-otp.dto';
import { PaymentService } from 'src/comman/payment/payment.service';
import { InvoiceService } from 'src/comman/invoice/invoice.service';
import { CloudinaryService } from 'src/comman/cloudinary/cloudinary.service';
import { DriverService } from '../driver/driver.service';
import { MailService } from 'src/comman/mail/mail.service';
import { RideRatingDto } from './dto/rating.dto';
import { RideRating, RideRatingDocument } from 'src/comman/schema/rating.schma';
import { log } from 'console';
import { DriverPayment, DriverPaymentDocument } from 'src/comman/schema/DriverPaymentInfo.schema';
import { DriverEarning, DriverEarningDocument } from 'src/comman/schema/driver-earnings.schema';
import { Payment, PaymentDocument } from 'src/comman/schema/payment.schema';
import { Setting, SettingDocument } from 'src/comman/schema/setting.schema';
import { EarningsStatus, PlatformEarningCollection, PlatformEarningDocument } from 'src/comman/schema/platform-earning.schema';
import { CustomerSupportService } from '../customer-support/customer-support.service';
import { ReportIssueDto } from './dto/report-issue.dto';
import { inherits } from 'util';
import { CustomerSupport, CustomerSupportDocument } from 'src/comman/schema/customerSupport.schema';
import { TotalRideEarning, TotalRideEarningDocument } from 'src/comman/schema/total-ride-earning.schema';

@Injectable()
export class RideService {
  private readonly logger = new Logger(RideService.name);
  private rideTimers: Map<string, { userTimeout: NodeJS.Timeout; driverTimeouts: NodeJS.Timeout[] }> = new Map();
  private readonly twilioClient;


  constructor(
    @InjectModel(Ride.name) private readonly rideModel: Model<RideDocument>,
    @InjectModel(TemporaryRide.name) private readonly TemporyRideModel: Model<TemporaryRideDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(RideRating.name) private readonly rideRatingModel: Model<RideRatingDocument>,
    @InjectModel(DriverPayment.name) private readonly driverPaymentModel: Model<DriverPaymentDocument>,
    @InjectModel(DriverEarning.name) private readonly driverEarningModel: Model<DriverEarningDocument>,
    @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(Setting.name) private readonly settingModel: Model<SettingDocument>,
    @InjectModel(PlatformEarningCollection.name) private readonly plateformEarningModel: Model<PlatformEarningDocument>,
    @InjectModel(CustomerSupport.name) private readonly customerSupportModel: Model<CustomerSupportDocument>,
    @InjectModel(TotalRideEarning.name) private readonly totalRideEarning: Model<TotalRideEarningDocument>,
    private readonly rideGateway: RideGateway,
    private readonly paymentService: PaymentService,
    private readonly invoiceService: InvoiceService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly driverService: DriverService,
    private readonly mailService: MailService,
    private readonly supportService: CustomerSupportService,
  ) {
    const accountSid = process.env.TWILIO_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioClient = twilio(accountSid, authToken);
  }

  /** --- Helper Methods --- */

  private getDistanceKm(coord1: number[], coord2: number[]): number {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    const earthRadius = 6371; // km

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

    return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private async getNearbyDrivers(coordinates: [number, number], radius: number, vehicleType: string) {
    console.log("location", coordinates)
    const drivers = await this.userModel.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates },
          distanceField: 'distance',
          maxDistance: radius * 1000,
          spherical: true,
          key: 'location',
        },
      },
      {
        $match: {
          role: 'driver',
          available: true,
          status: 'active'
        }
      },
      {
        $lookup: {
          from: 'vehicledetails',
          localField: 'vehicleDetails',
          foreignField: '_id',
          as: 'vehicleDetails',
        },
      },
      { $unwind: '$vehicleDetails' },
      { $match: { 'vehicleDetails.type': vehicleType } },
      {
        $project: {
          _id: 1,
          name: 1,
          location: 1,
          vehicleDetails: { type: 1, model: 1, numberPlate: 1 },
          distance: 1,
          available: 1,
        },
      },
    ]);

    return drivers;
  }
  private async sendRideRequestToDrivers(ride: any) {
    let nearbyDrivers = await this.getNearbyDrivers(ride.pickupLocation.coordinates, 12, ride.vehicleType);

    if (!nearbyDrivers || nearbyDrivers.length === 0) {
      nearbyDrivers = await this.getNearbyDrivers(ride.pickupLocation.coordinates, 15, ride.vehicleType);
      if (!nearbyDrivers || nearbyDrivers.length === 0) {
        await this.TemporyRideModel.findByIdAndDelete(ride._id);
        throw new BadGatewayException('No driver available nearby!');
      }
      await this.TemporyRideModel.findByIdAndUpdate(ride._id, { sentToRadius: 7 });
    }

    await this.TemporyRideModel.findByIdAndUpdate(ride._id, {
      eligibleDrivers: nearbyDrivers.map((d) => d._id),
    });

    const driverTimeouts: NodeJS.Timeout[] = [];
    nearbyDrivers.forEach((driver) => {
      this.rideGateway.sendRideRequest(driver._id.toString(), ride);

      const driverTimeout = setTimeout(() => {
        this.rideGateway.sendRideTerminated(driver._id.toString(), {
          rideId: ride._id,
          message: 'Ride request expired',
        });
      }, 30 * 1000);
      driverTimeouts.push(driverTimeout);
    });

    const userTimeout = setTimeout(async () => {
      const rideStatus = await this.TemporyRideModel.findById(ride._id);
      if (rideStatus && rideStatus.status === 'processing') {
        await this.TemporyRideModel.findByIdAndDelete(ride._id);
        this.rideGateway.sendRideTerminated(ride.bookedBy.toString(), {
          rideId: ride._id,
          message: 'No driver accepted the ride. Ride terminated.',
        });
        this.clearRideTimers(ride._id.toString());
      }
    }, 60 * 1000);

    this.rideTimers.set(ride._id.toString(), { userTimeout, driverTimeouts });
  }

  private clearRideTimers(rideId: string) {
    const timers = this.rideTimers.get(rideId);
    if (!timers) return;
    clearTimeout(timers.userTimeout);
    timers.driverTimeouts.forEach((t) => clearTimeout(t));
    this.rideTimers.delete(rideId);
  }
  private calculateFare(
    distance: number,
    vehicleType: string,
    settings: any,
    options: {
      isNight?: boolean;
      hasTolls?: boolean;
      hasParking?: boolean;
      waitingTime?: number;
      surgeMultiplier?: number;
      promoCode?: string;
    } = {},
  ) {
    const {
      isNight = false,
      hasTolls = distance > 20,
      hasParking = false,
      waitingTime = 0,
      surgeMultiplier = 1,
      promoCode = null,
    } = options;

    // --- base rates & gst ---
    const baseRates = {
      bike: settings.bikeBaseFare,
      car: settings.carBaseFare,
    };
    const gstRates = {
      bike: settings.bikeGstPercent,
      car: settings.carGstPercent,
    };
    const waitingCharges = {
      bike: settings.bikeWaitingChargePerMin,
      car: settings.carWaitingChargePerMin,
    };

    const platformFeePercent = settings.platformFeePercent;
    const nightChargePercent = settings.nightChargePercent;
    const parkingFee = settings.parkingFee;
    const tollPricePerKm = settings.tollPricePerKm;

    // --- Base Fare ---
    let baseFare =
      distance *
      baseRates[vehicleType.toLowerCase() as keyof typeof baseRates];

    // --- Adjustments that are fully transferred to driver ---
    const surgeCharge = baseFare * (surgeMultiplier - 1);
    const nightCharge = isNight ? baseFare * (nightChargePercent / 100) : 0;
    const waitingCharge = waitingTime * waitingCharges[vehicleType.toLowerCase()];
    const tollFee = hasTolls ? distance * tollPricePerKm : 0;

    // --- Platform-applicable components (base fare only for platform fee calculation) ---
    const platformApplicableAmount = baseFare;

    // --- Discounts (applied only to platform-applicable amount) ---
    let promoDiscount = promoCode ? platformApplicableAmount * 0.1 : 0;
    let referralDiscount = 0;

    // --- After Discounts (platform-applicable amount only) ---
    const discountedPlatformAmount = platformApplicableAmount - promoDiscount - referralDiscount;

    // --- Platform Fee (calculated on discounted base fare only) ---
    const platformFee = discountedPlatformAmount * (platformFeePercent / 100);

    // --- GST Calculation ---
    const gstPercent =
      gstRates[vehicleType.toLowerCase() as keyof typeof gstRates];

    // GST on base fare (platform keeps this GST)
    const gstOnBaseFare = discountedPlatformAmount * (gstPercent / 100);

    // GST on driver-transferred charges (this GST goes to driver, not platform)
    const gstOnDriverCharges = (surgeCharge + nightCharge + waitingCharge) * (gstPercent / 100);

    // Total GST (customer pays this full amount)
    const totalGstAmount = gstOnBaseFare + gstOnDriverCharges;

    // --- Parking fee (treated separately) ---
    const parkingAmount = hasParking ? parkingFee : 0;
    const gstOnParking = parkingAmount * (gstPercent / 100);

    // --- Total Fare (user pays) ---
    const totalFare = discountedPlatformAmount + surgeCharge + nightCharge + waitingCharge +
      tollFee + parkingAmount + totalGstAmount + gstOnParking;

    // --- Driver Earnings ---
    // Driver gets: 
    // - Base fare (after discounts) - platform fee
    // + Full surge charge (including GST portion)
    // + Full night charge (including GST portion) 
    // + Full waiting charge (including GST portion)
    // + Full toll fee (no GST)
    const driverEarnings = discountedPlatformAmount - platformFee +
      surgeCharge + nightCharge + waitingCharge + tollFee
    // --- Platform Earnings ---

    const platformEarnings = platformFee + gstOnBaseFare +
      gstOnDriverCharges;

    // --- Return consistent result ---
    return {
      totalFare: Math.round(totalFare),
      driverEarnings: Math.round(driverEarnings),
      platformEarnings: Math.round(platformEarnings),
      fareBreakdown: {
        baseFare: Math.round(baseFare),
        surgeCharge: Math.round(surgeCharge),
        nightCharge: Math.round(nightCharge),
        waitingCharge: Math.round(waitingCharge),
        tollFee: Math.round(tollFee),
        parkingFee: Math.round(parkingAmount),
        subTotal: Math.round(baseFare + surgeCharge + nightCharge + waitingCharge + tollFee + parkingAmount),
        promoDiscount: Math.round(promoDiscount),
        referralDiscount: Math.round(referralDiscount),
        discountedSubTotal: Math.round(discountedPlatformAmount + surgeCharge + nightCharge + waitingCharge + tollFee + parkingAmount),
        gstAmount: Math.round(totalGstAmount + gstOnParking),
        gstOnBaseFare: Math.round(gstOnBaseFare),
        gstOnDriverCharges: Math.round(gstOnDriverCharges),
        gstOnParking: Math.round(gstOnParking),
        platformFee: Math.round(platformFee),
        bonusAmount: 0,
        totalFare: Math.round(totalFare),
      },
    };
  }

  private async fareUpdate(rideId: string, waitingTime: number) {
    const ride = await this.rideModel.findById(rideId);
    if (!ride) throw new Error('Ride not found');

    const settings = await this.settingModel.findOne();
    if (!settings) throw new Error('Settings not found');

    const vehicleType = ride.vehicleType.toLowerCase();

    const waitingCharges = {
      bike: settings.bikeWaitingChargePerMin,
      car: settings.carWaitingChargePerMin,
    };

    const waitingCharge = waitingTime * waitingCharges[vehicleType.toLowerCase()];
    const gstPercent = vehicleType === 'bike' ? settings.bikeGstPercent : settings.carGstPercent;
    const extraGst = waitingCharge * (gstPercent / 100);

    console.log("waiting charge:", waitingCharge)

    const paymentInfo = await this.rideModel.findByIdAndUpdate(
      rideId,
      {
        $inc: {
          TotalFare: waitingCharge + extraGst,
          driverEarnings: waitingCharge,
          'fareBreakdown.waitingCharge': waitingCharge,
          'fareBreakdown.gstAmount': extraGst,
          'fareBreakdown.totalFare': waitingCharge + extraGst,
        },
      },
      { new: true }
    );

    return paymentInfo;
  }

  private async updateDriverRating(driverId: Types.ObjectId): Promise<void> {
    const ratings = await this.rideRatingModel.find({ driver: driverId })
    if (ratings.length > 0) {
      const averageRating = ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length;

      await this.userModel.updateOne(
        { _id: driverId },
        { $set: { rating: Number(averageRating.toFixed(1)) } }
      );
    }
  }

  private async recordPlatformEarning(
    rideId: string,
    driverId: Types.ObjectId,
    userId: Types.ObjectId,
    paymentId: Types.ObjectId | string,
    amount: number,
    rideStatus: string
  ) {
    const earning = await this.plateformEarningModel.create({
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



  /** --- Ride Methods --- */

  async createRide(request: any, createRideDto: CreateRideDto): Promise<ApiResponse<any>> {
    const { dropoffLocationCoordinates, pickupLocationCoordinates, vehicleType } = createRideDto;

    if (!request.user?._id) throw new UnauthorizedException('User not found!');

    // Validate coordinates
    if (
      !Array.isArray(pickupLocationCoordinates) ||
      pickupLocationCoordinates.length !== 2 ||
      !Array.isArray(dropoffLocationCoordinates) ||
      dropoffLocationCoordinates.length !== 2
    ) {
      throw new BadRequestException('Invalid coordinates format');
    }

    const [lon1, lat1] = pickupLocationCoordinates;
    const [lon2, lat2] = dropoffLocationCoordinates;

    if (lon1 < -180 || lon1 > 180 || lat1 < -90 || lat1 > 90 || lon2 < -180 || lon2 > 180 || lat2 < -90 || lat2 > 90) {
      throw new BadRequestException('Coordinates out of valid range');
    }

    // Fetch settings
    const settings = await this.settingModel.findOne().select('-adminId -__v -_id -createdAt -updatedAt -refundPolicy');
    if (!settings) throw new Error('Settings not found!');
    console.log('setting data:', settings);

    // Calculate distance & fare
    const distance = this.getDistanceKm(pickupLocationCoordinates, dropoffLocationCoordinates);
    const fareDetails = this.calculateFare(distance, vehicleType, settings, {});

    const {
      totalFare,
      driverEarnings,
      platformEarnings,
      fareBreakdown
    } = fareDetails;

    // Create temporary ride
    const newRide = await this.TemporyRideModel.create({
      pickupLocation: { type: 'Point', coordinates: pickupLocationCoordinates },
      dropoffLocation: { type: 'Point', coordinates: dropoffLocationCoordinates },
      bookedBy: request.user._id,
      vehicleType,
      sentToRadius: 5,
      distance,
      TotalFare: totalFare,
      driverEarnings,
      platformEarnings: fareBreakdown.platformFee,
      gstAmount: fareBreakdown.gstAmount,
      fareBreakdown,
      status: 'processing',
      paymentStatus: 'unpaid',
      eligibleDrivers: [],
      otp: crypto.randomInt(1000, 9999),
    });

    // Aggregate ride details for response
    const rideDetails = await this.TemporyRideModel.aggregate([
      { $match: { _id: newRide._id } },
      {
        $lookup: {
          from: 'users',
          localField: 'bookedBy',
          foreignField: '_id',
          as: 'bookedBy',
        },
      },
      { $unwind: '$bookedBy' },
      {
        $project: {
          _id: 1,
          bookedBy: { _id: 1, name: 1, profilePic: 1, email: 1, contactNumber: 1 },
          vehicleType: 1,
          status: 1,
          pickupLocation: '$pickupLocation.coordinates',
          dropoffLocation: '$dropoffLocation.coordinates',
          distance: 1,
          TotalFare: 1,
          driverEarnings: 1,
          platformEarnings: 1,
          fareBreakdown: 1,
          paymentStatus: 1,
          otp: 1,
        },
      },
    ]);

    // Send ride request to nearby drivers
    await this.sendRideRequestToDrivers(newRide);

    return new ApiResponse(true, 'Ride created successfully!', HttpStatus.OK, rideDetails[0]);
  }


  async acceptRide(rideId: string, request: any): Promise<ApiResponse<any>> {
    const driver = request.user;
    if (!driver || driver.role !== 'driver') throw new UnauthorizedException('You are not a driver!');

    const session = await this.rideModel.db.startSession();
    session.startTransaction();

    try {
      // Check if driver is still available
      const currentDriver = await this.userModel.findById(driver._id).session(session);

      // Add null check for currentDriver
      if (!currentDriver) {
        throw new NotFoundException('Driver not found');
      }

      if (!currentDriver.available) {
        throw new BadRequestException('You are no longer available for rides');
      }

      const tempRide = await this.TemporyRideModel.findOneAndUpdate(
        {
          _id: new Types.ObjectId(rideId),
          status: 'processing',
          eligibleDrivers: driver._id
        },
        { $set: { driver: driver._id, status: 'accepted' } },
        { new: true, session },
      );

      if (!tempRide) throw new BadRequestException('Ride already accepted, not found, or you are not eligible!');

      // Mark driver as unavailable
      await this.userModel.findByIdAndUpdate(
        driver._id,
        { available: false },
        { session }
      );

      this.clearRideTimers(rideId);

      const otp = crypto.randomInt(1000, 9999).toString();

      const newRideDoc = await this.rideModel.create([{
        _id: rideId,
        bookedBy: tempRide.bookedBy,
        driver: driver._id,
        vehicleType: tempRide.vehicleType,
        pickupLocation: tempRide.pickupLocation,
        dropoffLocation: tempRide.dropoffLocation,
        distance: tempRide.distance,
        baseFare: tempRide.fareBreakdown.baseFare,
        gstAmount: tempRide.fareBreakdown.gstAmount,
        platformFee: tempRide.fareBreakdown.platformFee,
        surgeCharge: tempRide.fareBreakdown.surgeCharge,
        nightCharge: tempRide.fareBreakdown.nightCharge,
        tollFee: tempRide.fareBreakdown.tollFee,
        parkingFee: tempRide.fareBreakdown.parkingFee,
        waitingCharge: tempRide.fareBreakdown.waitingCharge,
        bonusAmount: tempRide.fareBreakdown.bonusAmount,
        referralDiscount: tempRide.fareBreakdown.referralDiscount,
        promoDiscount: tempRide.fareBreakdown.promoDiscount,
        subTotal: tempRide.fareBreakdown.subTotal,
        TotalFare: tempRide.fareBreakdown.totalFare,
        driverEarnings: tempRide.driverEarnings,
        platformEarnings: tempRide.platformEarnings,
        fareBreakdown: tempRide.fareBreakdown,
        status: 'accepted',
        otp: tempRide.otp,
        acceptedAt: new Date(),
      }], { session });

      await this.TemporyRideModel.findByIdAndDelete(tempRide._id, { session });

      await session.commitTransaction();
      session.endSession();

      const ride = newRideDoc[0];
      await ride.populate('bookedBy driver');

      const { otp: _, ...rideData } = ride.toObject();
      this.rideGateway.sendRideAccepted(tempRide.bookedBy.toString(), rideData);

      return new ApiResponse(true, 'Ride accepted successfully!', HttpStatus.OK, rideData);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
  async driverArrive(rideId: string, request: any): Promise<ApiResponse<any>> {
    if (!rideId) throw new BadRequestException('Ride ID is required');
    if (!Types.ObjectId.isValid(rideId)) throw new BadRequestException('Invalid Ride ID format');

    const driver = request.user;
    if (!driver || driver.role !== 'driver') throw new UnauthorizedException('You are not authorized as a driver');

    const ride = await this.rideModel.findById(rideId).populate('bookedBy driver');
    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.driver?._id.toString() !== driver._id.toString()) throw new UnauthorizedException('You are not assigned to this ride');

    if (ride.status !== 'accepted') throw new BadRequestException(`Ride cannot be marked as arrived from current status: ${ride.status}`);

    ride.status = 'arrived';
    ride.arrivedAt = new Date();
    await ride.save();

    const user = ride.bookedBy;

    const otp = ride.otp;
    await retry(async () => {
      await this.twilioClient.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: process.env.TWILIO_MY_NUMBER,
        body: `Your ride OTP is ${otp}.`,
      });
    });

    this.rideGateway.sendDriverArrived(user._id.toString(), {
      rideId: ride._id,
      message: 'Driver has arrived at your location',
      driver: ride.driver,
      arrivedAt: ride.arrivedAt,
    });

    return new ApiResponse(true, 'Driver arrival recorded successfully!', HttpStatus.OK, {
      rideId: ride._id,
      status: ride.status,
      arrivedAt: ride.arrivedAt,
    });
  }

  async verifyRideOtp(rideId: string, request: any, verifyRideOtpDto: VerifyRideOtpDto, role: Role): Promise<ApiResponse<any>> {
    const user = request.user;
    if (!user) throw new UnauthorizedException('Unauthorized');

    const ride = await this.rideModel.findById(rideId);
    if (!ride) throw new NotFoundException('Ride not found');


    if (role === Role.Driver && ride.driver?.toString() !== user._id.toString())
      throw new UnauthorizedException('You are not the assigned driver for this ride');

    if (!ride.otp) throw new BadRequestException('No OTP found for this ride');
    if (ride.otp !== verifyRideOtpDto.otp) throw new BadRequestException('Invalid OTP');


    ride.status = 'started';
    ride.otp = 0;
    ride.startedAt = new Date();
    await ride.save();

    this.rideGateway.sendDriverStarted(ride.bookedBy.toString(), {
      rideId: ride._id,
      message: 'Ride has started.',
    });

    return new ApiResponse(true, 'OTP verified successfully!', HttpStatus.OK, ride);
  }

  async cencelRide(rideId: string, request: any, reason: string): Promise<ApiResponse<any>> {
    const user = request.user;
    if (!user) throw new UnauthorizedException('Unauthorized');

    const session = await this.rideModel.db.startSession();
    session.startTransaction();

    try {
      const ride = await this.rideModel.findById(rideId).session(session);
      if (!ride) throw new NotFoundException('Ride not found');

      if (!ride.driver) {
        throw new NotFoundException("ride Driver not found");
      }

      if (ride.status === 'completed' || ride.status === 'cancelled') {
        throw new BadRequestException('Ride cannot be cancelled at this stage');
      }

      const isDriver = ride.driver?.toString() === user._id.toString();
      const isPassenger = ride.bookedBy.toString() === user._id.toString();
      if (!isDriver && !isPassenger) throw new UnauthorizedException('Not authorized');

      ride.status = 'cancelled';
      ride.cancelReason = reason;
      ride.cancelledBy = isDriver ? 'Driver' : 'User';
      ride.cancelledAt = new Date();

      await ride.save({ session });

      // Make driver available again
      await this.userModel.findByIdAndUpdate(
        ride.driver._id,
        { available: true },
        { session }
      );

      const response = await this.paymentService.handleRefund(rideId);
      if (!response) {
        throw new BadRequestException("Payment refund not created");
      }

      const driverEarning = await this.driverService.recordDriverEarning(
        rideId,
        ride.driver?._id,
        ride.bookedBy?._id,
        String(ride.paymentId),
        response.driverEarning,
        ride.status
      );

      const driverPayment = await this.driverPaymentModel.findOneAndUpdate(
        { driverId: ride.driver._id },
        {
          $inc: {
            totalEarnings: driverEarning.amount,
            balance: driverEarning.amount,
          },
        },
        { new: true, upsert: true, session }
      );

      const platformEarning = await this.recordPlatformEarning(
        rideId,
        ride.driver,
        ride.bookedBy,
        ride.paymentId as any,
        response.platformEarning,
        ride.status
      );

      ride.driverEarnings = response.driverEarning;
      ride.platformEarnings = response.platformEarning;
      await ride.save({ session });

      const otherCharges: Number = ride.TotalFare - Number(ride.gstAmount) - Number(ride.driverEarnings) - Number(ride.platformEarnings)

      await this.totalRideEarning.create({
        platformEarningId: platformEarning._id,
        driverEarningId: driverEarning._id,
        rideId,
        gstAmount: ride.gstAmount,
        driverEarning: ride.driverEarnings,
        platformEarning: ride.platformEarnings,
        totalAmount: ride.TotalFare,
        otherCharges: otherCharges
      })

      this.clearRideTimers(rideId);

      await session.commitTransaction();
      session.endSession();

      const recipientId = isDriver ? ride.bookedBy.toString() : ride.driver?.toString();
      if (recipientId) {
        this.rideGateway.sendRideTerminated(recipientId, { rideId, message: reason });
      }

      return new ApiResponse(true, 'Ride cancelled successfully!', HttpStatus.OK, ride);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async paymentRide(rideId: string, request: any): Promise<ApiResponse<any>> {
    if (!Types.ObjectId.isValid(rideId)) throw new BadRequestException('Invalid rideId');

    const ride = await this.rideModel.findById(rideId).populate('bookedBy driver');
    if (!ride) throw new NotFoundException('Ride not found');

    if (!request.user || request.user._id.toString() !== ride.bookedBy._id.toString())
      throw new UnauthorizedException('Not authorized');

    if (ride.paymentStatus === 'paid') throw new BadRequestException('Ride already paid');

    const extraMinutes =
      ride.status === 'arrived' && ride.arrivedAt
        ? Math.max(0, Math.floor((Date.now() - new Date(ride.arrivedAt).getTime()) / (1000 * 60) - 5))
        : 0;

    console.log("extra time:", extraMinutes)

    const settings = await this.settingModel.findOne();
    if (!settings) throw new BadRequestException('Settings not found');

    await this.fareUpdate(rideId, extraMinutes)



    const successUrl = `${process.env.FRONTEND_URL}/payment-success?rideId=${rideId}`;
    const cancelUrl = `${process.env.FRONTEND_URL}/payment-cancel?rideId=${rideId}`;

    const session = await this.paymentService.createCheckoutSession(successUrl, cancelUrl, ride.TotalFare, rideId);

    return new ApiResponse(true, 'Checkout session created', HttpStatus.OK, { url: session });
  }

  async confirmPayment(rideId: string): Promise<Buffer> {
    const ride = await this.rideModel.findById(rideId).populate('bookedBy driver');
    if (!ride) throw new NotFoundException('Ride not found');

    // Update Payment document
    const payment = await this.paymentModel.findOne({ rideId });
    if (!payment) throw new NotFoundException('Payment document not found');

    ride.paymentStatus = 'paid';
    ride.paidAt = new Date();
    await ride.save();

    payment.status = 'paid';
    await payment.save();

    const pdfBuffer = await this.invoiceService.generateInvoice(rideId);
    if (!pdfBuffer) throw new BadRequestException('Failed to generate invoice');

    if (ride.invoiceUrl) {
      const oldPublicId = ride.invoiceUrl.split('/upload/')[1]?.replace(/\.[^/.]+$/, '');
      await this.cloudinaryService.deleteFile(oldPublicId).catch((error) => {
        this.logger.error(`Failed to delete old invoice from Cloudinary: ${error.message}`);
      });
    }

    const uploadResult = await this.cloudinaryService.uploadFile({
      buffer: pdfBuffer,
      originalname: `invoice-${rideId}.pdf`,
    });

    if (!uploadResult) throw new BadRequestException('Failed to upload invoice to cloud');

    const baseUrl = uploadResult.secure_url.replace('/upload/', '/upload/fl_attachment:false/');
    ride.invoiceUrl = baseUrl;
    await ride.save();

    this.logger.log(`Invoice uploaded to Cloudinary: ${baseUrl}`);

    this.rideGateway.sendRidePaymentConfirmed(ride.bookedBy._id.toString(), {
      rideId: ride._id,
      message: 'Payment confirmed successfully',
      invoiceUrl: baseUrl,
    });

    // Send invoice email
    try {
      const email = 'mayank8355@gmail.com'; // Use bookedBy email
      const subject = 'Ride Payment Confirmed - Your Invoice';
      await this.mailService.sendPdf({ email, subject, pdfBuffer });
      this.logger.log(`Invoice email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send invoice email: ${error.message}`);
      this.rideGateway.sendRideTerminated(ride.bookedBy._id.toString(), {
        rideId: ride._id,
        message: 'Failed to send invoice email. Please contact support.',
      });
    }

    return pdfBuffer;
  }

  async reportIssue(
    rideId: Types.ObjectId,
    userId: Types.ObjectId,
    role: 'user' | 'driver',
    dto: ReportIssueDto
  ) {
    const ride = await this.rideModel.findById(rideId).exec();
    if (!ride) throw new NotFoundException('Ride not found');

    if (role === 'driver') {
      if (!ride.driver?.equals(userId)) {
        throw new NotFoundException("You are not eligible to report this ride");
      }
    } else if (role === 'user') {
      if (!ride.bookedBy?.equals(userId)) {
        throw new NotFoundException("You are not eligible to report this ride");
      }
    }

    return await this.supportService.createSupportTicket({
      rideId,
      userId,
      role,
      subject: dto.subject,
      message: dto.message,
    });
  }


  async rideComplete(rideId: string, request: any): Promise<ApiResponse<any>> {
    if (!Types.ObjectId.isValid(rideId)) {
      throw new BadRequestException('Invalid rideId');
    }

    const session = await this.rideModel.db.startSession();
    session.startTransaction();

    try {
      const ride = await this.rideModel.findById(rideId).populate('bookedBy driver paymentId').session(session);
      if (!ride) throw new NotFoundException('Ride not found');

      const user = request.user;
      if (!user || !ride.driver || user._id.toString() !== ride.driver._id.toString()) {
        throw new UnauthorizedException('Not authorized');
      }

      if (ride.paymentStatus !== 'paid') {
        throw new BadRequestException('Ride not complete, payment not completed');
      }
      if (ride.status === 'cancelled') {
        throw new BadRequestException('Ride cannot be completed as it was cancelled');
      }

      ride.status = 'completed';
      ride.completedAt = new Date();
      await ride.save({ session });

      // Make driver available again
      await this.userModel.findByIdAndUpdate(
        ride.driver._id,
        { available: true },
        { session }
      );

      const paymentId = ride.paymentId ? ride.paymentId : new Types.ObjectId();
      const driverEarning = await this.driverService.recordDriverEarning(
        String(ride._id),
        ride.driver._id,
        ride.bookedBy._id,
        paymentId._id,
        ride.driverEarnings,
        ride.status
      );

      const driverPayment = await this.driverPaymentModel.findOneAndUpdate(
        { driverId: ride.driver._id },
        {
          $inc: {
            totalEarnings: ride.driverEarnings,
            balance: ride.driverEarnings,
          },
        },
        { new: true, upsert: true, session }
      );

      const platformEarning = await this.recordPlatformEarning(
        rideId,
        ride.driver,
        ride.bookedBy,
        ride.paymentId as any,
        ride.platformEarnings,
        ride.status
      );


      const otherCharges: Number = ride.TotalFare - Number(ride.gstAmount) - Number(ride.driverEarnings) - Number(ride.platformEarnings)

      await this.totalRideEarning.create({
        platformEarningId: platformEarning._id,
        driverEarningId: driverEarning._id,
        rideId,
        gstAmount: ride.gstAmount,
        driverEarning: ride.driverEarnings,
        platformEarning: ride.platformEarnings,
        totalAmount: ride.TotalFare,
        otherCharges: otherCharges
      })
      await session.commitTransaction();
      session.endSession();

      this.rideGateway.sendRideCompleted(ride.bookedBy._id.toString(), {
        rideId: ride._id,
        message: 'Ride completed successfully',
      });

      if (ride.driver) {
        this.rideGateway.sendRideCompleted(ride.driver._id.toString(), {
          rideId: ride._id,
          message: 'Ride completed successfully',
          earnings: ride.driverEarnings,
        });
      }

      try {
        const pdfBuffer = await this.invoiceService.generateInvoice(rideId);
        if (!pdfBuffer || !(pdfBuffer instanceof Buffer)) {
          throw new BadRequestException('PDF buffer not created');
        }

        const email = 'mayank8355@gmail.com';
        const subject = 'Ride Completed - Your Invoice';
        await this.mailService.sendPdf({ email, subject, pdfBuffer });

        this.logger.log(`Invoice email sent successfully to ${email}`);
      } catch (error) {
        this.logger.error(`Failed to generate or send invoice email: ${error.message}`);
        this.rideGateway.sendRideTerminated(ride.bookedBy._id.toString(), {
          rideId: ride._id,
          message: 'Failed to send invoice email. Please contact support.',
        });
      }

      return new ApiResponse(true, 'Ride completed successfully!', HttpStatus.OK, { ride });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw new InternalServerErrorException('Failed to complete ride: ' + error.message);
    }
  }

  async rideRating(rideId: string, request: any, ratingDto: RideRatingDto): Promise<ApiResponse<any>> {

    if (!Types.ObjectId.isValid(rideId)) {
      throw new BadRequestException('Invalid rideId');
    }
    const ride = await this.rideModel
      .findById(rideId)
      .populate('bookedBy driver');

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.status !== "completed") {
      throw new BadRequestException("Oops:Ride not complete")
    }


    const user = request.user;
    if (!user || !ride.bookedBy || user._id.toString() !== ride.bookedBy._id.toString()) {
      throw new UnauthorizedException('Only the passenger who booked the ride can rate it');
    }

    if (!ride.driver) {
      throw new BadRequestException("Driver Information not present....")
    }
    if (ratingDto.rating < 1 || ratingDto.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const existingRating = await this.rideRatingModel.findOne({
      ride: rideId,
      user: user._id,
    });

    if (existingRating) {
      throw new BadRequestException('This ride has already been rated by the user');
    }

    const newRating = new this.rideRatingModel({
      driver: ride.driver,
      user: user._id,
      ride: rideId,
      rating: ratingDto.rating,
      message: ratingDto.message,
    });
    await newRating.save();

    await this.rideModel.findByIdAndUpdate(rideId, { ratingId: newRating._id })
    await this.updateDriverRating(ride.driver._id)
    return new ApiResponse(true, 'Ride rated successfully!', HttpStatus.OK, {
      rating: newRating,
    });
  }

}