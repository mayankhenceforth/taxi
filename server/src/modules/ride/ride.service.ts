import {
  BadGatewayException,
  BadRequestException,
  HttpStatus,
  Injectable,
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

// Calculate total fare
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
    const newRideDoc = await this.rideModel.create({
      bookedBy: tempRide.bookedBy,
      driver: driver._id,
      vehicleType: tempRide.vehicleType,
      pickupLocation: tempRide.pickupLocation,
      dropoffLocation: tempRide.dropoffLocation,
      distance: tempRide.distance,
      fare: tempRide.fare,
      status: 'accepted',
      otp,
      TotalFare: tempRide.fare,
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

    // Vehicle-specific fare & GST
    let farePerKm: number;
    let gstPercent: number;
    switch (ride.vehicleType) {
      case 'bike':
        farePerKm = parseFloat(process.env.RIDE_FARE ?? '10');
        gstPercent = parseFloat(process.env.RIDE_BIKE_GST ?? '10');
        break;
      case 'car':
        farePerKm = parseFloat(process.env.RIDE_CAR_FARE ?? '20');
        gstPercent = parseFloat(process.env.RIDE_CAR_GST ?? '12');
        break;
      default:
        throw new BadRequestException('Invalid vehicle type');
    }

    const baseFare = ride.distance * farePerKm;
    const totalAmount = Math.round(baseFare * (1 + gstPercent / 100));

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

}
