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
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import ApiResponse from 'src/comman/helpers/api-response';
import { CreateRideDto } from './dto/create-ride.dto';
import { RideGateway } from './ride.gateway';
import { User, UserDocument } from 'src/comman/schema/user.schema';
import * as crypto from 'crypto';
import * as twilio from 'twilio';
import { Role } from 'src/comman/enums/role.enum';
import { VerifyRideOtpDto } from './dto/verify-ride-otp.dto';
import { PaymentService } from 'src/comman/payment/payment.service';
import { InvoiceService } from 'src/comman/invoice/invoice.service';
import { CloudinaryService } from 'src/comman/cloudinary/cloudinary.service';
import { DriverService } from '../driver/driver.service';

@Injectable()
export class RideService {
  private rideTimers: Map<string, { userTimeout: NodeJS.Timeout; driverTimeouts: NodeJS.Timeout[] }> = new Map();

  private readonly twilioClient;


  constructor(
    @InjectModel(Ride.name) private readonly rideModel: Model<RideDocument>,
    @InjectModel(TemporaryRide.name) private readonly TemporyRideModel: Model<TemporaryRideDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly rideGateway: RideGateway,
    private readonly paymentService: PaymentService,
    private readonly invoiceService: InvoiceService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly driverService :DriverService
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
      { $match: { role: 'driver' } },
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

  private calculateFare(distance: number, vehicleType: string, options: {
  isNight?: boolean;
  hasTolls?: boolean;
  hasParking?: boolean;
  waitingTime?: number;
  surgeMultiplier?: number;
  promoCode?: string;
} = {}) {
  const {
    isNight = false,
    hasTolls = false,
    hasParking = false,
    waitingTime = 0,
    surgeMultiplier = 1,
    promoCode = null
  } = options;

  // Base rates
  const baseRates = {
    bike: parseFloat(process.env.RIDE_BIKE_FARE ?? '10'),
    car: parseFloat(process.env.RIDE_CAR_FARE ?? '20')
  };

  const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT ?? '20');
  const gstPercent = parseFloat(process.env.GST_PERCENT ?? '18');
  const nightChargePercent = parseFloat(process.env.NIGHT_CHARGE_PERCENT ?? '25');
  const waitingChargePerMin = parseFloat(process.env.WAITING_CHARGE_PER_MIN ?? '1');
  const tollFee = parseFloat(process.env.TOLL_FEE ?? '50');
  const parkingFee = parseFloat(process.env.PARKING_FEE ?? '30');

  // Calculate base fare
  const baseFare = distance * baseRates[vehicleType.toLowerCase() as keyof typeof baseRates];

  // Additional charges
  const surgeCharge = baseFare * (surgeMultiplier - 1);
  const nightCharge = isNight ? baseFare * (nightChargePercent / 100) : 0;
  const waitingCharge = waitingTime * waitingChargePerMin;

  // Subtotal before discounts
  const subTotal = baseFare + surgeCharge + nightCharge + waitingCharge + 
                  (hasTolls ? tollFee : 0) + (hasParking ? parkingFee : 0);

  // Apply discounts
  let promoDiscount = 0;
  let referralDiscount = 0;
  
  // Calculate promo discount logic here
  if (promoCode) {
    promoDiscount = subTotal * 0.1; // Example: 10% discount for promo code
  }

  // GST calculation
  const gstAmount = (subTotal - promoDiscount - referralDiscount) * (gstPercent / 100);

  // Platform fee
  const platformFee = (subTotal - promoDiscount - referralDiscount) * (platformFeePercent / 100);

  // Total fare
  const totalFare = subTotal + gstAmount + platformFee - promoDiscount - referralDiscount;

  // Driver earnings (80% of base fare + surge + night charge - platform fee)
  const driverEarnings = (baseFare + surgeCharge + nightCharge + waitingCharge) * 0.8;

  return {
    baseFare,
    gstAmount,
    platformFee,
    surgeCharge,
    nightCharge,
    tollFee: hasTolls ? tollFee : 0,
    parkingFee: hasParking ? parkingFee : 0,
    waitingCharge,
    bonusAmount: 0,
    referralDiscount,
    promoDiscount,
    subTotal,
    totalFare: Math.round(totalFare),
    driverEarnings: Math.round(driverEarnings),
    platformEarnings: Math.round(platformFee),
    fareBreakdown: {
      baseFare,
      gstAmount,
      platformFee,
      surgeCharge,
      nightCharge,
      tollFee: hasTolls ? tollFee : 0,
      parkingFee: hasParking ? parkingFee : 0,
      waitingCharge,
      bonusAmount: 0,
      referralDiscount,
      promoDiscount,
      subTotal,
      totalFare: Math.round(totalFare)
    }
  };
}

  /** --- Ride Methods --- */

  async createRide(request: any, createRideDto: CreateRideDto): Promise<ApiResponse<any>> {
  const { dropoffLocationCoordinates, pickupLocationCoordinates, vehicleType } = createRideDto;

  if (!request.user?._id) throw new UnauthorizedException('User not found!');

  const distance = this.getDistanceKm(pickupLocationCoordinates, dropoffLocationCoordinates);

  let farePerKm: number;
  let gstPercent: number;

  switch (vehicleType.toLowerCase()) {
    case 'bike':
      farePerKm = parseFloat(process.env.RIDE_BIKE_FARE ?? '10');
      gstPercent = parseFloat(process.env.RIDE_BIKE_GST ?? '5');
      break;
    case 'car':
      farePerKm = parseFloat(process.env.RIDE_CAR_FARE ?? '20');
      gstPercent = parseFloat(process.env.RIDE_CAR_GST ?? '12');
      break;
    default:
      farePerKm = parseFloat(process.env.RIDE_FARE ?? '15');
      gstPercent = parseFloat(process.env.RIDE_FARE_GST ?? '10');
  }

  // Calculate base fare and total fare
  const baseFare = distance * farePerKm;
  const tax = baseFare * (gstPercent / 100);
  const totalFare = Math.round(baseFare + tax);

  if (totalFare <= 0) throw new BadRequestException('Invalid fare calculation');

  const newRide = await this.TemporyRideModel.create({
    pickupLocation: { type: 'Point', coordinates: pickupLocationCoordinates },
    dropoffLocation: { type: 'Point', coordinates: dropoffLocationCoordinates },
    bookedBy: request.user._id,
    vehicleType,
    distance,
    baseFare, // Add this field
    estimatedGst: tax, // Add this field
    estimatedPlatformFee: 0, // You can calculate this if needed
    surgeMultiplier: 1, // Default to 1
    fare: totalFare,
    status: 'processing',
    eligibleDrivers: [],
  });

  const rideDetails = await this.TemporyRideModel.aggregate([
    { $match: { _id: newRide._id } },
    { $lookup: { from: 'users', localField: 'bookedBy', foreignField: '_id', as: 'bookedBy' } },
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
        baseFare: 1, // Include in projection
        fare: 1,
      },
    },
  ]);

  await this.sendRideRequestToDrivers(newRide);

  return new ApiResponse(true, 'Ride created successfully!', HttpStatus.OK, rideDetails[0]);
}

  async acceptRide(rideId: string, request: any): Promise<ApiResponse<any>> {
  const driver = request.user;
  if (!driver || driver.role !== 'driver') throw new UnauthorizedException('You are not a driver!');

  const tempRide = await this.TemporyRideModel.findOneAndUpdate(
    { _id: new Types.ObjectId(rideId), status: 'processing', eligibleDrivers: driver._id },
    { $set: { driver: driver._id, status: 'accepted' } },
    { new: true },
  );
  if (!tempRide) throw new BadRequestException('Ride already accepted, not found, or you are not eligible!');

  this.clearRideTimers(rideId);

  const otp = crypto.randomInt(1000, 9999).toString();
  
  // Calculate the complete fare breakdown for the permanent ride
  const fareBreakdown = this.calculateFare(
    tempRide.distance,
    tempRide.vehicleType,
    {
      // You can pass additional options here if needed
      surgeMultiplier: tempRide.surgeMultiplier || 1,
    }
  );

  const newRideDoc = await this.rideModel.create({
    bookedBy: tempRide.bookedBy,
    driver: driver._id,
    vehicleType: tempRide.vehicleType,
    pickupLocation: tempRide.pickupLocation,
    dropoffLocation: tempRide.dropoffLocation,
    distance: tempRide.distance,
    
    // Fare details
    baseFare: tempRide.baseFare,
    gstAmount: tempRide.estimatedGst || 0,
    platformFee: fareBreakdown.platformFee,
    surgeMultiplier: tempRide.surgeMultiplier || 1,
    surgeCharge: fareBreakdown.surgeCharge,
    nightCharge: fareBreakdown.nightCharge,
    tollFee: fareBreakdown.tollFee,
    parkingFee: fareBreakdown.parkingFee,
    waitingCharge: fareBreakdown.waitingCharge,
    bonusAmount: 0,
    referralDiscount: 0,
    promoDiscount: 0,
    
    // Total calculations
    subTotal: fareBreakdown.subTotal,
    TotalFare: tempRide.fare,
    driverEarnings: fareBreakdown.driverEarnings,
    platformEarnings: fareBreakdown.platformEarnings,
    
    // Fare breakdown object
    fareBreakdown: fareBreakdown.fareBreakdown,
    
    status: 'accepted',
    otp,
    acceptedAt: new Date(),
  });

  await newRideDoc.populate('bookedBy driver');
  await this.TemporyRideModel.findByIdAndDelete(tempRide._id);

  const user = await this.userModel.findById(newRideDoc.bookedBy);
  if (user) {
    await this.twilioClient.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${user.contactNumber}`,
      body: `Your ride OTP is ${otp}.`,
    });
  }

  const { otp: _, ...rideData } = newRideDoc.toObject();
  this.rideGateway.sendRideAccepted(tempRide.bookedBy.toString(), rideData);

  return new ApiResponse(true, 'Ride accepted successfully!', HttpStatus.OK, newRideDoc);
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
    await ride.save();

    return new ApiResponse(true, 'OTP verified successfully!', HttpStatus.OK, ride);
  }

  async cencelRide(rideId: string, request: any, reason: string): Promise<ApiResponse<any>> {
    const user = request.user;
    if (!user) throw new UnauthorizedException('Unauthorized');

    const ride = await this.rideModel.findById(rideId);
    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.status === 'completed' || ride.status === 'cancelled')
      throw new BadRequestException('Ride cannot be cancelled at this stage');

    const isDriver = ride.driver?.toString() === user._id.toString();
    const isPassenger = ride.bookedBy.toString() === user._id.toString();
    if (!isDriver && !isPassenger) throw new UnauthorizedException('Not authorized');

    ride.status = 'cancelled';
    ride.cancelReason = reason;
    ride.cancelledBy = isDriver ? 'Driver' : 'User';
    await ride.save();

    this.clearRideTimers(rideId);

    const recipientId = isDriver ? ride.bookedBy.toString() : ride.driver?.toString();
    if (recipientId) {
      this.rideGateway.sendRideTerminated(recipientId, { rideId, message: reason });
    }

    return new ApiResponse(true, 'Ride cancelled successfully!', HttpStatus.OK, ride);
  }

  async paymentRide(rideId: string, request: any): Promise<ApiResponse<any>> {
    if (!Types.ObjectId.isValid(rideId)) throw new BadRequestException('Invalid rideId');

    const ride = await this.rideModel.findById(rideId).populate('bookedBy driver');
    if (!ride) throw new NotFoundException('Ride not found');

    const user = request.user;
    if (!user || user._id.toString() !== ride.bookedBy._id.toString())
      throw new UnauthorizedException('Not authorized');

    if (ride.status !== 'started') throw new BadRequestException('Ride is not in a state to pay for');
    if (ride.paymentStatus === 'paid') throw new BadRequestException('Ride already paid');

  
    const totalAmount = ride.TotalFare;

    const successUrl = `${process.env.FRONTEND_URL}/payment-success?rideId=${rideId}`;
    const cancelUrl = `${process.env.FRONTEND_URL}/payment-cancel?rideId=${rideId}`;

    const session = await this.paymentService.createCheckoutSession(successUrl, cancelUrl, totalAmount * 100, rideId);

    return new ApiResponse(true, 'Checkout session created', 200, { url: session });
  }

  async confirmPayment(rideId: string): Promise<Buffer> {
  const ride = await this.rideModel.findById(rideId).populate('bookedBy driver');
  if (!ride) throw new NotFoundException('Ride not found');

  ride.paymentStatus = 'paid';
  await ride.save();

  const pdfBuffer = await this.invoiceService.generateInvoice(rideId);
  if (!pdfBuffer) throw new BadRequestException('Failed to generate invoice');

  if (ride.invoiceUrl) {
    const oldPublicId = ride.invoiceUrl
      .split('/upload/')[1] 
      .replace(/\.[^/.]+$/, "");
    await this.cloudinaryService.deleteFile(oldPublicId);
  }

  const uploadResult = await this.cloudinaryService.uploadFile({
    buffer: pdfBuffer,
    originalname: `invoice-${rideId}.pdf`,
  });

  if (!uploadResult) {
    throw new BadRequestException('Failed to upload invoice to cloud');
  }

  
  let baseUrl = uploadResult.secure_url.replace(
    '/upload/',
    '/upload/fl_attachment:false/'
  );

  ride.invoiceUrl = baseUrl;
  await ride.save();

  console.log('Invoice URL:', baseUrl);

 
  this.rideGateway.sendRidePaymentConfirmed(ride.bookedBy._id.toString(), {
    rideId: ride._id,
    message: 'Payment confirmed successfully',
    invoiceUrl: baseUrl
  });

  return pdfBuffer;
}

   async rideComplete(rideId: string, request: any): Promise<ApiResponse<any>> {
  if (!Types.ObjectId.isValid(rideId)) throw new BadRequestException('Invalid rideId');
  
  const ride = await this.rideModel.findById(rideId).populate('bookedBy driver');
  if (!ride) throw new NotFoundException('Ride not found');

  const user = request.user;
  if (!user || !ride.driver || user._id.toString() !== ride.driver._id.toString())
    throw new UnauthorizedException('Not authorized');

  if (ride.paymentStatus !== 'paid') 
    throw new BadRequestException('Ride not complete, payment not completed');

  if (ride.status === "cancelled") 
    throw new BadRequestException("Ride cannot be completed as it was cancelled");

  const session = await this.rideModel.db.startSession();
  session.startTransaction();

  try {
    ride.status = 'completed';
    ride.completedAt = new Date();
    await ride.save({ session });

    const driverEarnings = await this.driverService.updateDriverEarnings(
      ride._id as Types.ObjectId,
      ride.driver._id as Types.ObjectId,
      ride.TotalFare * 0.8
    );

    await session.commitTransaction();
    session.endSession();

    this.rideGateway.sendRideCompleted(ride.bookedBy._id.toString(), {
      rideId: ride._id,
      message: 'Ride completed successfully'
    });

    if (ride.driver) {
      this.rideGateway.sendRideCompleted(ride.driver._id.toString(), {
        rideId: ride._id,
        message: 'Ride completed successfully',
        earnings: ride.TotalFare * 0.8
      });
    }

    return new ApiResponse(true, 'Ride completed successfully!', HttpStatus.OK, {
      ride,
      earnings: driverEarnings
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new InternalServerErrorException('Failed to complete ride: ' + error.message);
  }
}
}
