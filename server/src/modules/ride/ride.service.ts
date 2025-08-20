import {
  BadGatewayException,
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Ride, RideDocument, TemporaryRide, TemporaryRideDocument } from '../../comman/schema/ride.schema';
import mongoose, { Model, Types } from 'mongoose';
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
@Injectable()
export class RideService {
  private rideTimers: Map<string, { userTimeout: NodeJS.Timeout, driverTimeouts: NodeJS.Timeout[] }> = new Map();
  private readonly farePrice: number = parseFloat(process.env.RIDE_FARE ?? '10');
  private readonly farePriceWithGST: number = parseFloat(process.env.Ride_FARE_GST ?? '11.5');
  private readonly twilioClient;

  constructor(
    @InjectModel(Ride.name) private readonly rideModel: Model<RideDocument>,
    @InjectModel(TemporaryRide.name) private readonly TemporyRideModel: Model<TemporaryRideDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly rideGateway: RideGateway,
    private readonly paymentService: PaymentService,
    private readonly invoiceService: InvoiceService,
  ) {
    const accountSid = process.env.TWILIO_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioClient = twilio(accountSid, authToken);
  }


  private getDistanceKm(coord1: number[], coord2: number[]) {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    const earthRadius = 6371;

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

    return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private async getNearbyDrivers(
    coordinates: [number, number],
    radius: number,
    requestedVehicleType: string,
  ) {
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
      { $match: { 'vehicleDetails.type': requestedVehicleType } },
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



    console.log("drivers:", drivers);


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

    // Save eligible drivers in temporary ride
    await this.TemporyRideModel.findByIdAndUpdate(ride._id, { eligibleDrivers: nearbyDrivers.map(d => d._id) });

    const driverTimeouts: NodeJS.Timeout[] = [];

    nearbyDrivers.forEach(driver => {
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
    timers.driverTimeouts.forEach(t => clearTimeout(t));
    this.rideTimers.delete(rideId);
  }

  async createRide(request: any, createRideDto: CreateRideDto): Promise<ApiResponse<any>> {
    const { dropoffLocationCoordinates, pickupLocationCoordinates, vehicleType } = createRideDto;

    if (!request.user?._id) throw new UnauthorizedException('User not found!');
    const distance = this.getDistanceKm(pickupLocationCoordinates, dropoffLocationCoordinates);
    const fare = distance * this.farePrice;
    const fareIncludingGST = Math.round(fare * (1 + this.farePriceWithGST / 100));

    if (fare <= 0) {
      throw new BadRequestException('Invalid distance or fare calculation');
    }


    const newRide = await this.TemporyRideModel.create({
      pickupLocation: { type: 'Point', coordinates: pickupLocationCoordinates },
      dropoffLocation: { type: 'Point', coordinates: dropoffLocationCoordinates },
      bookedBy: request.user._id,
      vehicleType,
      distance,
      fare: fareIncludingGST,
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

    // Only accept if driver is eligible
    const tempRide = await this.TemporyRideModel.findOneAndUpdate(
      { _id: new Types.ObjectId(rideId), status: 'processing', eligibleDrivers: driver._id },
      { $set: { driver: driver._id, status: 'accepted' } },
      { new: true },
    );

    if (!tempRide) throw new BadRequestException('Ride already accepted, not found, or you are not eligible!');

    const timers = this.rideTimers.get(rideId);
    if (timers) this.clearRideTimers(rideId);

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

    const newRide = await newRideDoc;
    await newRide.populate('bookedBy driver');

    await this.TemporyRideModel.findByIdAndDelete(tempRide._id);

    const user = await this.userModel.findById(newRide.bookedBy);
    if (user) {
      await this.twilioClient.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `+91${user.contactNumber}`, // adjust country code
        body: `Your ride OTP is ${otp}.`,
      });
    }

    const { otp: _, ...rideData } = newRide.toObject();
    this.rideGateway.sendRideAccepted(tempRide.bookedBy.toString(), rideData);

    return new ApiResponse(true, 'Ride has been accepted successfully!', HttpStatus.OK, newRide);
  }

  async verifyRideOtp(
    rideId: string,
    request: any,
    verifyRideOtpDto: VerifyRideOtpDto,
    role: Role,
  ): Promise<ApiResponse<any>> {
    const user = request.user;

    if (!user) throw new UnauthorizedException('Unauthorized');
    const ride = await this.rideModel.findOne({ _id: rideId })


    if (!ride) throw new NotFoundException('Ride not found');

    if (role === Role.Driver && (!ride.driver || ride.driver.toString() !== user._id.toString())) {
      throw new UnauthorizedException('You are not the assigned driver for this ride');
    }

    if (!ride.otp) {
      throw new BadRequestException('No OTP found for this ride');
    }

    if (ride.otp !== verifyRideOtpDto.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    ride.status = 'started';
    ride.otp = 0;
    await ride.save();

    return new ApiResponse(true, 'OTP verified successfully!', HttpStatus.OK, ride);
  }

  async cencelRide(
    rideId: string,
    request: any,
    reason: string,
  ): Promise<ApiResponse<any>> {
    const user = request.user;


    if (!user) throw new UnauthorizedException('Unauthorized');

    const ride = await this.rideModel.findById(rideId)
    if (!ride) throw new NotFoundException('Ride not found');

    if (ride.status === 'completed' || ride.status === 'cancelled') {
      throw new BadRequestException('Ride cannot be cancelled at this stage');
    }


    const isDriver = ride.driver?.toString() === user._id.toString();
    const isPassenger = ride.bookedBy.toString() == user._id.toString();
    if (!isDriver && !isPassenger) {
      throw new UnauthorizedException('You are not authorized to cancel this ride');
    }

    ride.status = 'cancelled';
    ride.cancelReason = reason;
    ride.cancelledBy = isDriver ? 'Driver' : 'User';
    await ride.save();


    this.clearRideTimers(rideId);

    const recipientId = isDriver ? ride.bookedBy.toString() : ride.driver?.toString();
    if (recipientId) {
      this.rideGateway.sendRideTerminated(recipientId, {
        rideId,
        message: reason,
      });
    }

    return new ApiResponse(true, 'Ride cancelled successfully!', HttpStatus.OK, ride);
  }

 async paymentRide(rideId: string, request: any): Promise<ApiResponse<any>> {
  console.log("rideId:", rideId);
  if (!Types.ObjectId.isValid(rideId)) {
    throw new BadRequestException('Invalid rideId');
  }
  

  // console.log("rideId:", rideId);

  const ride = await this.rideModel.findById(rideId).populate('bookedBy driver');
  // console.log("ride:", ride);
  if (!ride) throw new NotFoundException('Ride not found');

  const user = request.user;
  console.log("user:", user);
  if (!user || user._id.toString() !== ride.bookedBy._id.toString()) {
    throw new UnauthorizedException('You are not authorized to make payment for this ride');
  }

  if (ride.status !== 'started') {
    throw new BadRequestException('Ride is not in a state to be paid for');
  }

  if (ride.paymentStatus === 'paid') {
    throw new BadRequestException('Ride has already been paid for');
  }

  // fare calculation
  const farePerKm = process.env.RIDE_FARE ? parseFloat(process.env.RIDE_FARE) : 10;
  const baseFare = ride.distance * farePerKm;
  const gst = baseFare * 0.1;
  const totalAmount = baseFare + gst;

  const successUrl = `${process.env.FRONTEND_URL}/payment-success?rideId=${rideId}`;
  const cancelUrl = `${process.env.FRONTEND_URL}/payment-cancel?rideId=${rideId}`;

  const session = await this.paymentService.createCheckoutSession(
    successUrl,
    cancelUrl,
    totalAmount * 100, // cents
    rideId,
  );

  return new ApiResponse(true, 'Checkout session created', 200, { url: session });
}

async confirmPayment(rideId: string): Promise<Buffer> {

  const ride = await this.rideModel.findById(rideId).populate('bookedBy driver');
  if (!ride) throw new NotFoundException('Ride not found');

  ride.paymentStatus = 'paid';
  await ride.save();

  const rideIdStr = (ride._id as unknown as string) 

  const pdfBuffer = await this.invoiceService.generateInvoice(rideIdStr);
  return pdfBuffer;
}


}
