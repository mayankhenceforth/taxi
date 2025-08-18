import {
  BadGatewayException,
  BadRequestException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Ride, RideDocument, TemporaryRide, TemporaryRideDocument } from '../../comman/schema/ride.schema';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import ApiResponse from 'src/comman/helpers/api-response';
import { CreateRideDto } from './dto/create-ride.dto';
import { RideGateway } from './ride.gateway';
import { User, UserDocument } from 'src/comman/schema/user.schema';

@Injectable()
export class RideService {
  private rideTimers: Map<string, { userTimeout: NodeJS.Timeout, driverTimeouts: NodeJS.Timeout[] }> = new Map();
  
  constructor(
    @InjectModel(Ride.name) private readonly rideModel: Model<RideDocument>,
    @InjectModel(TemporaryRide.name) private readonly TemporyRideModel: Model<TemporaryRideDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly rideGateway: RideGateway,
    private readonly farePrice:number= 10
  ) { }

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

    console.log("coordinates", coordinates);

    const driver = await this.userModel.aggregate([
      {
        $geoNear: {
          near: coordinates,
          distanceField: "distance",
          maxDistance: radius * 1000,
          spherical: true,
        }
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

    // console.log("drivers",(driver[0].distance/1000).toFixed(2));


    return driver
  }



  private async sendRideRequestToDrivers(ride: any) {
    console.log("ride", ride);

    let nearbyDrivers = await this.getNearbyDrivers(ride.pickupLocation, 12, ride.vehicleType);
    console.log("near by drivers:", nearbyDrivers);

    if (!nearbyDrivers || nearbyDrivers.length === 0) {
      nearbyDrivers = await this.getNearbyDrivers(ride.pickupLocation, 15, ride.vehicleType);
      if (!nearbyDrivers || nearbyDrivers.length === 0) {
        await this.rideModel.findByIdAndDelete(ride._id);
        throw new BadGatewayException('No driver available nearby!');
      }
      await this.rideModel.findByIdAndUpdate(ride._id, { sentToRadius: 7 });
    }

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
      const rideStatus = await this.rideModel.findById(ride._id);
      if (rideStatus && rideStatus.status === 'processing') {
        await this.rideModel.findByIdAndDelete(ride._id);
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

    // Calculate fare: 10 rupees per km
    const fare = distance * this.farePrice;

    // Create temporary ride
    const newRide = await this.TemporyRideModel.create({
      pickupLocation: { type: 'Point', coordinates: pickupLocationCoordinates },
      dropoffLocation: { type: 'Point', coordinates: dropoffLocationCoordinates },
      bookedBy: request.user._id,
      vehicleType,
      distance,
      fare,
      status: 'processing',
    });

    // Fetch ride details for response
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

    console.log("rides details:",rideDetails);
    

    // Send ride request to nearby drivers via WebSocket
    await this.sendRideRequestToDrivers(newRide);

    return new ApiResponse(true, 'Ride created successfully!', HttpStatus.OK, rideDetails[0]);
  }

async acceptRide(rideId: string, request: any): Promise<ApiResponse<any>> {
  const driver = request.user;

  if (!driver || driver.role !== 'driver') throw new UnauthorizedException('You are not a driver!');

  const tempRide = await this.TemporyRideModel.findOneAndUpdate(
    { _id: new Types.ObjectId(rideId), status: 'processing' },
    { $set: { driver: driver._id, status: 'accepted' } },
    { new: true },
  );

  if (!tempRide) throw new BadRequestException('Ride already accepted or not found!');

  const timers = this.rideTimers.get(rideId);
  if (timers) {
    
    timers.driverTimeouts.forEach(() => {
    });
    this.clearRideTimers(rideId);
  }
  const newRide = await this.rideModel.create({
    bookedBy: tempRide.bookedBy,
    driver: driver._id,
    vehicleType: tempRide.vehicleType,
    pickupLocation: tempRide.pickupLocation,
    dropoffLocation: tempRide.dropoffLocation,
    distance: tempRide.distance,
    fare: tempRide.fare,
    status: 'accepted',
    sentToRadius: 5,
  });

  await this.TemporyRideModel.findByIdAndDelete(tempRide._id);

  this.rideGateway.sendRideAccepted(tempRide.bookedBy.toString(), newRide);
  timers?.driverTimeouts.forEach((timeout, index) => {
   });

  return new ApiResponse(true, 'Ride has been accepted successfully!', HttpStatus.OK, newRide);
}

}
