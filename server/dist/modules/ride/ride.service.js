"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RideService = void 0;
const common_1 = require("@nestjs/common");
const ride_schema_1 = require("../../comman/schema/ride.schema");
const mongoose_1 = require("mongoose");
const mongoose_2 = require("@nestjs/mongoose");
const api_response_1 = require("../../comman/helpers/api-response");
const ride_gateway_1 = require("./ride.gateway");
const user_schema_1 = require("../../comman/schema/user.schema");
const crypto = require("crypto");
const twilio = require("twilio");
const role_enum_1 = require("../../comman/enums/role.enum");
const payment_service_1 = require("../../comman/payment/payment.service");
const invoice_service_1 = require("../../comman/invoice/invoice.service");
const cloudinary_service_1 = require("../../comman/cloudinary/cloudinary.service");
let RideService = class RideService {
    rideModel;
    TemporyRideModel;
    userModel;
    rideGateway;
    paymentService;
    invoiceService;
    cloudinaryService;
    rideTimers = new Map();
    twilioClient;
    constructor(rideModel, TemporyRideModel, userModel, rideGateway, paymentService, invoiceService, cloudinaryService) {
        this.rideModel = rideModel;
        this.TemporyRideModel = TemporyRideModel;
        this.userModel = userModel;
        this.rideGateway = rideGateway;
        this.paymentService = paymentService;
        this.invoiceService = invoiceService;
        this.cloudinaryService = cloudinaryService;
        const accountSid = process.env.TWILIO_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        this.twilioClient = twilio(accountSid, authToken);
    }
    getDistanceKm(coord1, coord2) {
        const [lon1, lat1] = coord1;
        const [lon2, lat2] = coord2;
        const earthRadius = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) ** 2;
        return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    async getNearbyDrivers(coordinates, radius, vehicleType) {
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
    async sendRideRequestToDrivers(ride) {
        let nearbyDrivers = await this.getNearbyDrivers(ride.pickupLocation.coordinates, 12, ride.vehicleType);
        if (!nearbyDrivers || nearbyDrivers.length === 0) {
            nearbyDrivers = await this.getNearbyDrivers(ride.pickupLocation.coordinates, 15, ride.vehicleType);
            if (!nearbyDrivers || nearbyDrivers.length === 0) {
                await this.TemporyRideModel.findByIdAndDelete(ride._id);
                throw new common_1.BadGatewayException('No driver available nearby!');
            }
            await this.TemporyRideModel.findByIdAndUpdate(ride._id, { sentToRadius: 7 });
        }
        await this.TemporyRideModel.findByIdAndUpdate(ride._id, {
            eligibleDrivers: nearbyDrivers.map((d) => d._id),
        });
        const driverTimeouts = [];
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
    clearRideTimers(rideId) {
        const timers = this.rideTimers.get(rideId);
        if (!timers)
            return;
        clearTimeout(timers.userTimeout);
        timers.driverTimeouts.forEach((t) => clearTimeout(t));
        this.rideTimers.delete(rideId);
    }
    async createRide(request, createRideDto) {
        const { dropoffLocationCoordinates, pickupLocationCoordinates, vehicleType } = createRideDto;
        if (!request.user?._id)
            throw new common_1.UnauthorizedException('User not found!');
        const distance = this.getDistanceKm(pickupLocationCoordinates, dropoffLocationCoordinates);
        let farePerKm;
        let gstPercent;
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
        const baseFare = distance * farePerKm;
        const tax = baseFare * (gstPercent / 100);
        const totalFare = Math.round(baseFare + tax);
        if (totalFare <= 0)
            throw new common_1.BadRequestException('Invalid fare calculation');
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
        return new api_response_1.default(true, 'Ride created successfully!', common_1.HttpStatus.OK, rideDetails[0]);
    }
    async acceptRide(rideId, request) {
        const driver = request.user;
        if (!driver || driver.role !== 'driver')
            throw new common_1.UnauthorizedException('You are not a driver!');
        const tempRide = await this.TemporyRideModel.findOneAndUpdate({ _id: new mongoose_1.Types.ObjectId(rideId), status: 'processing', eligibleDrivers: driver._id }, { $set: { driver: driver._id, status: 'accepted' } }, { new: true });
        if (!tempRide)
            throw new common_1.BadRequestException('Ride already accepted, not found, or you are not eligible!');
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
        return new api_response_1.default(true, 'Ride accepted successfully!', common_1.HttpStatus.OK, newRideDoc);
    }
    async verifyRideOtp(rideId, request, verifyRideOtpDto, role) {
        const user = request.user;
        if (!user)
            throw new common_1.UnauthorizedException('Unauthorized');
        const ride = await this.rideModel.findById(rideId);
        if (!ride)
            throw new common_1.NotFoundException('Ride not found');
        if (role === role_enum_1.Role.Driver && ride.driver?.toString() !== user._id.toString())
            throw new common_1.UnauthorizedException('You are not the assigned driver for this ride');
        if (!ride.otp)
            throw new common_1.BadRequestException('No OTP found for this ride');
        if (ride.otp !== verifyRideOtpDto.otp)
            throw new common_1.BadRequestException('Invalid OTP');
        ride.status = 'started';
        ride.otp = 0;
        await ride.save();
        return new api_response_1.default(true, 'OTP verified successfully!', common_1.HttpStatus.OK, ride);
    }
    async cencelRide(rideId, request, reason) {
        const user = request.user;
        if (!user)
            throw new common_1.UnauthorizedException('Unauthorized');
        const ride = await this.rideModel.findById(rideId);
        if (!ride)
            throw new common_1.NotFoundException('Ride not found');
        if (ride.status === 'completed' || ride.status === 'cancelled')
            throw new common_1.BadRequestException('Ride cannot be cancelled at this stage');
        const isDriver = ride.driver?.toString() === user._id.toString();
        const isPassenger = ride.bookedBy.toString() === user._id.toString();
        if (!isDriver && !isPassenger)
            throw new common_1.UnauthorizedException('Not authorized');
        ride.status = 'cancelled';
        ride.cancelReason = reason;
        ride.cancelledBy = isDriver ? 'Driver' : 'User';
        await ride.save();
        this.clearRideTimers(rideId);
        const recipientId = isDriver ? ride.bookedBy.toString() : ride.driver?.toString();
        if (recipientId) {
            this.rideGateway.sendRideTerminated(recipientId, { rideId, message: reason });
        }
        return new api_response_1.default(true, 'Ride cancelled successfully!', common_1.HttpStatus.OK, ride);
    }
    async paymentRide(rideId, request) {
        if (!mongoose_1.Types.ObjectId.isValid(rideId))
            throw new common_1.BadRequestException('Invalid rideId');
        const ride = await this.rideModel.findById(rideId).populate('bookedBy driver');
        if (!ride)
            throw new common_1.NotFoundException('Ride not found');
        const user = request.user;
        if (!user || user._id.toString() !== ride.bookedBy._id.toString())
            throw new common_1.UnauthorizedException('Not authorized');
        if (ride.status !== 'started')
            throw new common_1.BadRequestException('Ride is not in a state to pay for');
        if (ride.paymentStatus === 'paid')
            throw new common_1.BadRequestException('Ride already paid');
        let farePerKm;
        let gstPercent;
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
                throw new common_1.BadRequestException('Invalid vehicle type');
        }
        const baseFare = ride.distance * farePerKm;
        const totalAmount = Math.round(baseFare * (1 + gstPercent / 100));
        const successUrl = `${process.env.FRONTEND_URL}/payment-success?rideId=${rideId}`;
        const cancelUrl = `${process.env.FRONTEND_URL}/payment-cancel?rideId=${rideId}`;
        const session = await this.paymentService.createCheckoutSession(successUrl, cancelUrl, totalAmount * 100, rideId);
        return new api_response_1.default(true, 'Checkout session created', 200, { url: session });
    }
    async confirmPayment(rideId) {
        const ride = await this.rideModel.findById(rideId).populate('bookedBy driver');
        if (!ride)
            throw new common_1.NotFoundException('Ride not found');
        ride.paymentStatus = 'paid';
        await ride.save();
        const pdfBuffer = await this.invoiceService.generateInvoice(rideId);
        if (!pdfBuffer)
            throw new common_1.BadRequestException('Failed to generate invoice');
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
            throw new common_1.BadRequestException('Failed to upload invoice to cloud');
        }
        let baseUrl = uploadResult.secure_url.replace('/upload/', '/upload/fl_attachment:false/');
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
};
exports.RideService = RideService;
exports.RideService = RideService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(ride_schema_1.Ride.name)),
    __param(1, (0, mongoose_2.InjectModel)(ride_schema_1.TemporaryRide.name)),
    __param(2, (0, mongoose_2.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_1.Model,
        mongoose_1.Model,
        mongoose_1.Model,
        ride_gateway_1.RideGateway,
        payment_service_1.PaymentService,
        invoice_service_1.InvoiceService,
        cloudinary_service_1.CloudinaryService])
], RideService);
//# sourceMappingURL=ride.service.js.map