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
var RideService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RideService = void 0;
const common_1 = require("@nestjs/common");
const ride_schema_1 = require("../../comman/schema/ride.schema");
const mongoose_1 = require("mongoose");
const mongoose_2 = require("@nestjs/mongoose");
const common_2 = require("@nestjs/common");
const api_response_1 = require("../../comman/helpers/api-response");
const ride_gateway_1 = require("./ride.gateway");
const user_schema_1 = require("../../comman/schema/user.schema");
const crypto = require("crypto");
const twilio = require("twilio");
const retry = require("async-retry");
const role_enum_1 = require("../../comman/enums/role.enum");
const payment_service_1 = require("../../comman/payment/payment.service");
const invoice_service_1 = require("../../comman/invoice/invoice.service");
const cloudinary_service_1 = require("../../comman/cloudinary/cloudinary.service");
const driver_service_1 = require("../driver/driver.service");
const mail_service_1 = require("../../comman/mail/mail.service");
const rating_schma_1 = require("../../comman/schema/rating.schma");
const DriverPaymentInfo_schema_1 = require("../../comman/schema/DriverPaymentInfo.schema");
const driver_earnings_schema_1 = require("../../comman/schema/driver-earnings.schema");
const payment_schema_1 = require("../../comman/schema/payment.schema");
let RideService = RideService_1 = class RideService {
    rideModel;
    TemporyRideModel;
    userModel;
    rideRatingModel;
    driverPaymentModel;
    driverEarningModel;
    paymentModel;
    rideGateway;
    paymentService;
    invoiceService;
    cloudinaryService;
    driverService;
    mailService;
    logger = new common_2.Logger(RideService_1.name);
    rideTimers = new Map();
    twilioClient;
    constructor(rideModel, TemporyRideModel, userModel, rideRatingModel, driverPaymentModel, driverEarningModel, paymentModel, rideGateway, paymentService, invoiceService, cloudinaryService, driverService, mailService) {
        this.rideModel = rideModel;
        this.TemporyRideModel = TemporyRideModel;
        this.userModel = userModel;
        this.rideRatingModel = rideRatingModel;
        this.driverPaymentModel = driverPaymentModel;
        this.driverEarningModel = driverEarningModel;
        this.paymentModel = paymentModel;
        this.rideGateway = rideGateway;
        this.paymentService = paymentService;
        this.invoiceService = invoiceService;
        this.cloudinaryService = cloudinaryService;
        this.driverService = driverService;
        this.mailService = mailService;
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
        console.log("location", coordinates);
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
    calculateFare(distance, vehicleType, options = {}) {
        const { isNight = false, hasTolls = distance > 20, hasParking = false, waitingTime = 0, surgeMultiplier = 1, promoCode = null, } = options;
        const baseRates = {
            bike: parseFloat(process.env.RIDE_BIKE_FARE ?? '15'),
            car: parseFloat(process.env.RIDE_CAR_FARE ?? '20'),
        };
        const gstRates = {
            bike: parseFloat(process.env.RIDE_BIKE_GST ?? '12'),
            car: parseFloat(process.env.RIDE_CAR_GST ?? '16'),
        };
        const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT ?? '20');
        const nightChargePercent = parseFloat(process.env.NIGHT_CHARGE_PERCENT ?? '25');
        const waitingChargePerMin = parseFloat(process.env.WAITING_CHARGE_PER_MIN ?? '1');
        const parkingFee = parseFloat(process.env.PARKING_FEE ?? '30');
        const tollPricePerKm = parseFloat(process.env.TOLL_PRICE_PER_KM ?? '2');
        const excessDistanceRate = parseFloat(process.env.EXCESS_DISTANCE_RATE ?? '3');
        let baseFare = 0;
        const baseRate = baseRates[vehicleType.toLowerCase()];
        baseFare = distance * baseRate;
        const surgeCharge = baseFare * (surgeMultiplier - 1);
        const nightCharge = isNight ? baseFare * (nightChargePercent / 100) : 0;
        const waitingCharge = waitingTime * waitingChargePerMin;
        const tollFee = hasTolls ? distance * tollPricePerKm : 0;
        const subTotal = baseFare + surgeCharge + nightCharge + waitingCharge + tollFee + (hasParking ? parkingFee : 0);
        let promoDiscount = 0;
        let referralDiscount = 0;
        if (promoCode)
            promoDiscount = subTotal * 0.1;
        const gstPercent = gstRates[vehicleType.toLowerCase()];
        const gstAmount = (subTotal - promoDiscount - referralDiscount) * (gstPercent / 100);
        const platformFee = (subTotal - promoDiscount - referralDiscount) * (platformFeePercent / 100);
        const totalFare = subTotal + gstAmount + platformFee - promoDiscount - referralDiscount;
        const driverEarnings = (baseFare + surgeCharge + nightCharge + waitingCharge) * 0.8;
        this.logger.debug('Fare Calculation Details:', {
            distance: Number(distance.toFixed(2)),
            baseFare: Number(baseFare.toFixed(2)),
            surgeCharge: Number(surgeCharge.toFixed(2)),
            nightCharge: Number(nightCharge.toFixed(2)),
            waitingCharge: Number(waitingCharge.toFixed(2)),
            tollFee: Number(tollFee.toFixed(2)),
            parkingFee: hasParking ? parkingFee : 0,
            subTotal: Number(subTotal.toFixed(2)),
            promoDiscount: Number(promoDiscount.toFixed(2)),
            referralDiscount: Number(referralDiscount.toFixed(2)),
            gstAmount: Number(gstAmount.toFixed(2)),
            platformFee: Number(platformFee.toFixed(2)),
            totalFare: Math.round(totalFare),
            driverEarnings: Math.round(driverEarnings),
        });
        return {
            baseFare,
            gstAmount,
            platformFee,
            surgeCharge,
            nightCharge,
            tollFee,
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
                tollFee,
                parkingFee: hasParking ? parkingFee : 0,
                waitingCharge,
                bonusAmount: 0,
                referralDiscount,
                promoDiscount,
                subTotal,
                totalFare: Math.round(totalFare),
            },
        };
    }
    async updateDriverRating(driverId) {
        const ratings = await this.rideRatingModel.find({ driver: driverId });
        console.log("ratings", ratings);
        if (ratings.length > 0) {
            const averageRating = ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length;
            await this.userModel.updateOne({ _id: driverId }, { $set: { rating: Number(averageRating.toFixed(1)) } });
        }
    }
    async createRide(request, createRideDto) {
        const { dropoffLocationCoordinates, pickupLocationCoordinates, vehicleType } = createRideDto;
        if (!request.user?._id)
            throw new common_1.UnauthorizedException('User not found!');
        if (!Array.isArray(pickupLocationCoordinates) ||
            pickupLocationCoordinates.length !== 2 ||
            !Array.isArray(dropoffLocationCoordinates) ||
            dropoffLocationCoordinates.length !== 2) {
            throw new common_1.BadRequestException('Invalid coordinates format');
        }
        const [lon1, lat1] = pickupLocationCoordinates;
        const [lon2, lat2] = dropoffLocationCoordinates;
        if (lon1 < -180 || lon1 > 180 || lat1 < -90 || lat1 > 90 || lon2 < -180 || lon2 > 180 || lat2 < -90 || lat2 > 90) {
            throw new common_1.BadRequestException('Coordinates out of valid range');
        }
        const distance = this.getDistanceKm(pickupLocationCoordinates, dropoffLocationCoordinates);
        const fareDetails = this.calculateFare(distance, vehicleType, {});
        const { baseFare, gstAmount, platformFee, tollFee, surgeCharge, nightCharge, waitingCharge, parkingFee, promoDiscount, referralDiscount, totalFare, driverEarnings, platformEarnings, fareBreakdown, } = fareDetails;
        const newRide = await this.TemporyRideModel.create({
            pickupLocation: { type: 'Point', coordinates: pickupLocationCoordinates },
            dropoffLocation: { type: 'Point', coordinates: dropoffLocationCoordinates },
            bookedBy: request.user._id,
            vehicleType,
            sentToRadius: 5,
            distance,
            TotalFare: totalFare,
            driverEarnings,
            platformEarnings,
            fareBreakdown,
            status: 'processing',
            paymentStatus: 'unpaid',
            eligibleDrivers: [],
            otp: crypto.randomInt(100000, 999999),
        });
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
        const fareBreakdown = this.calculateFare(tempRide.distance, tempRide.vehicleType, { surgeMultiplier: 1 });
        const newRideDoc = await this.rideModel.create({
            _id: rideId,
            bookedBy: tempRide.bookedBy,
            driver: driver._id,
            vehicleType: tempRide.vehicleType,
            pickupLocation: tempRide.pickupLocation,
            dropoffLocation: tempRide.dropoffLocation,
            distance: tempRide.distance,
            baseFare: fareBreakdown.baseFare,
            gstAmount: fareBreakdown.gstAmount,
            platformFee: fareBreakdown.platformFee,
            surgeCharge: fareBreakdown.surgeCharge,
            nightCharge: fareBreakdown.nightCharge,
            tollFee: fareBreakdown.tollFee,
            parkingFee: fareBreakdown.parkingFee,
            waitingCharge: fareBreakdown.waitingCharge,
            bonusAmount: 0,
            referralDiscount: 0,
            promoDiscount: 0,
            subTotal: fareBreakdown.subTotal,
            TotalFare: fareBreakdown.totalFare,
            driverEarnings: fareBreakdown.driverEarnings,
            platformEarnings: fareBreakdown.platformEarnings,
            fareBreakdown: fareBreakdown.fareBreakdown,
            status: 'accepted',
            otp,
            acceptedAt: new Date(),
        });
        await newRideDoc.populate('bookedBy driver');
        await this.TemporyRideModel.findByIdAndDelete(tempRide._id);
        const user = await this.userModel.findById(newRideDoc.bookedBy);
        if (user) {
            await retry(async () => {
                await this.twilioClient.messages.create({
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: `${user.contactNumber}`,
                    body: `Your ride OTP is ${otp}.`,
                });
            }).catch((error) => {
                this.logger.error(`Failed to send OTP SMS after retries: ${error.message}`);
                this.rideGateway.sendRideTerminated(user._id.toString(), {
                    rideId,
                    message: 'Failed to send OTP. Please contact support.',
                });
            });
        }
        const { otp: _, ...rideData } = newRideDoc.toObject();
        this.rideGateway.sendRideAccepted(tempRide.bookedBy.toString(), rideData);
        return new api_response_1.default(true, 'Ride accepted successfully!', common_1.HttpStatus.OK, rideData);
    }
    async driverArrive(rideId, request) {
        if (!rideId)
            throw new common_1.BadRequestException('Ride ID is required');
        if (!mongoose_1.Types.ObjectId.isValid(rideId))
            throw new common_1.BadRequestException('Invalid Ride ID format');
        const driver = request.user;
        if (!driver || driver.role !== 'driver')
            throw new common_1.UnauthorizedException('You are not authorized as a driver');
        const ride = await this.rideModel.findById(rideId);
        if (!ride)
            throw new common_1.NotFoundException('Ride not found');
        if (ride.driver?.toString() !== driver._id.toString())
            throw new common_1.UnauthorizedException('You are not assigned to this ride');
        if (ride.status !== 'accepted')
            throw new common_1.BadRequestException(`Ride cannot be marked as arrived from current status: ${ride.status}`);
        const updatedRide = await this.rideModel.findByIdAndUpdate(rideId, {
            status: 'arrived',
            arrivedAt: new Date(),
        }, { new: true }).populate('bookedBy driver');
        if (!updatedRide)
            throw new common_1.NotFoundException('Ride not found after update');
        this.rideGateway.sendDriverArrived(ride.bookedBy.toString(), {
            rideId: updatedRide._id,
            message: 'Driver has arrived at your location',
            driver: updatedRide.driver,
            arrivedAt: updatedRide.arrivedAt,
        });
        return new api_response_1.default(true, 'Driver arrival recorded successfully!', common_1.HttpStatus.OK, {
            rideId: updatedRide._id,
            status: updatedRide.status,
            arrivedAt: updatedRide.arrivedAt,
        });
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
        if (ride.status === 'arrived' && ride.arrivedAt) {
            const waitingTimeMinutes = (Date.now() - new Date(ride.arrivedAt).getTime()) / (1000 * 60);
            if (waitingTimeMinutes > 5) {
                const waitingChargePerMin = parseFloat(process.env.WAITING_CHARGE_PER_MIN ?? '1');
                const additionalWaitingCharge = Math.floor(waitingTimeMinutes - 5) * waitingChargePerMin;
                const fareDetails = this.calculateFare(ride.distance, ride.vehicleType, {
                    isNight: ride.fareBreakdown.nightCharge > 0,
                    hasTolls: ride.fareBreakdown.tollFee > 0,
                    hasParking: ride.fareBreakdown.parkingFee > 0,
                    waitingTime: ride.fareBreakdown.waitingCharge + additionalWaitingCharge,
                    surgeMultiplier: 1,
                });
                ride.fareBreakdown = fareDetails.fareBreakdown;
                ride.TotalFare = fareDetails.totalFare;
                ride.driverEarnings = fareDetails.driverEarnings;
                ride.platformEarnings = fareDetails.platformEarnings;
            }
        }
        ride.status = 'started';
        ride.otp = 0;
        ride.startedAt = new Date();
        await ride.save();
        this.rideGateway.sendDriverStarted(ride.bookedBy.toString(), {
            rideId: ride._id,
            message: 'Ride has started.',
        });
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
        ride.cancelledAt = new Date();
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
        if (ride.paymentStatus === 'paid')
            throw new common_1.BadRequestException('Ride already paid');
        const totalAmount = ride.TotalFare;
        const successUrl = `${process.env.FRONTEND_URL}/payment-success?rideId=${rideId}`;
        const cancelUrl = `${process.env.FRONTEND_URL}/payment-cancel?rideId=${rideId}`;
        const session = await this.paymentService.createCheckoutSession(successUrl, cancelUrl, rideId, totalAmount * 100);
        return new api_response_1.default(true, 'Checkout session created', common_1.HttpStatus.OK, { url: session });
    }
    async confirmPayment(rideId) {
        const ride = await this.rideModel.findById(rideId).populate('bookedBy driver');
        if (!ride)
            throw new common_1.NotFoundException('Ride not found');
        const payment = await this.paymentModel.findOne({ rideId });
        if (!payment)
            throw new common_1.NotFoundException('Payment document not found');
        ride.paymentStatus = 'paid';
        ride.paidAt = new Date();
        await ride.save();
        payment.status = 'paid';
        await payment.save();
        const pdfBuffer = await this.invoiceService.generateInvoice(rideId);
        if (!pdfBuffer)
            throw new common_1.BadRequestException('Failed to generate invoice');
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
        if (!uploadResult)
            throw new common_1.BadRequestException('Failed to upload invoice to cloud');
        const baseUrl = uploadResult.secure_url.replace('/upload/', '/upload/fl_attachment:false/');
        ride.invoiceUrl = baseUrl;
        await ride.save();
        this.logger.log(`Invoice uploaded to Cloudinary: ${baseUrl}`);
        this.rideGateway.sendRidePaymentConfirmed(ride.bookedBy._id.toString(), {
            rideId: ride._id,
            message: 'Payment confirmed successfully',
            invoiceUrl: baseUrl,
        });
        try {
            const email = 'mayank8355@gmail.com';
            const subject = 'Ride Payment Confirmed - Your Invoice';
            await this.mailService.sendPdf({ email, subject, pdfBuffer });
            this.logger.log(`Invoice email sent successfully to ${email}`);
        }
        catch (error) {
            this.logger.error(`Failed to send invoice email: ${error.message}`);
            this.rideGateway.sendRideTerminated(ride.bookedBy._id.toString(), {
                rideId: ride._id,
                message: 'Failed to send invoice email. Please contact support.',
            });
        }
        return pdfBuffer;
    }
    async rideComplete(rideId, request) {
        if (!mongoose_1.Types.ObjectId.isValid(rideId)) {
            throw new common_1.BadRequestException('Invalid rideId');
        }
        const ride = await this.rideModel.findById(rideId).populate('bookedBy driver');
        if (!ride)
            throw new common_1.NotFoundException('Ride not found');
        const user = request.user;
        if (!user || !ride.driver || user._id.toString() !== ride.driver._id.toString()) {
            throw new common_1.UnauthorizedException('Not authorized');
        }
        if (ride.paymentStatus !== 'paid') {
            throw new common_1.BadRequestException('Ride not complete, payment not completed');
        }
        if (ride.status === 'cancelled') {
            throw new common_1.BadRequestException('Ride cannot be completed as it was cancelled');
        }
        try {
            ride.status = 'completed';
            ride.completedAt = new Date();
            await ride.save();
            try {
                const pdfBuffer = await this.invoiceService.generateInvoice(rideId);
                if (!pdfBuffer || !(pdfBuffer instanceof Buffer)) {
                    throw new common_1.BadRequestException('PDF buffer not created');
                }
                const email = 'mayank8355@gmail.com';
                const subject = 'Ride Completed - Your Invoice';
                await this.mailService.sendPdf({ email, subject, pdfBuffer });
                this.logger.log(`Invoice email sent successfully to ${email}`);
            }
            catch (error) {
                this.logger.error(`Failed to generate or send invoice email: ${error.message}`);
                this.rideGateway.sendRideTerminated(ride.bookedBy._id.toString(), {
                    rideId: ride._id,
                    message: 'Failed to send invoice email. Please contact support.',
                });
            }
            const paymentId = ride.paymentId ? ride.paymentId : new mongoose_1.Types.ObjectId();
            await this.driverService.recordDriverEarning(String(ride._id), ride.driver._id, ride.bookedBy._id, paymentId, ride.driverEarnings);
            const driverPayment = await this.driverPaymentModel.findOneAndUpdate({ driverId: ride.driver._id }, {
                $inc: {
                    totalEarnings: ride.driverEarnings,
                    balance: ride.driverEarnings,
                },
            }, { new: true, upsert: true });
            this.logger.log(`Driver payment updated: ${JSON.stringify(driverPayment)}`);
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
            return new api_response_1.default(true, 'Ride completed successfully!', common_1.HttpStatus.OK, { ride });
        }
        catch (error) {
            throw new common_1.InternalServerErrorException('Failed to complete ride: ' + error.message);
        }
    }
    async rideRating(rideId, request, ratingDto) {
        if (!mongoose_1.Types.ObjectId.isValid(rideId)) {
            throw new common_1.BadRequestException('Invalid rideId');
        }
        const ride = await this.rideModel
            .findById(rideId)
            .populate('bookedBy driver');
        if (!ride) {
            throw new common_1.NotFoundException('Ride not found');
        }
        if (ride.status !== "completed") {
            throw new common_1.BadRequestException("Oops:Ride not complete");
        }
        const user = request.user;
        if (!user || !ride.bookedBy || user._id.toString() !== ride.bookedBy._id.toString()) {
            throw new common_1.UnauthorizedException('Only the passenger who booked the ride can rate it');
        }
        if (!ride.driver) {
            throw new common_1.BadRequestException("Driver Information not present....");
        }
        if (ratingDto.rating < 1 || ratingDto.rating > 5) {
            throw new common_1.BadRequestException('Rating must be between 1 and 5');
        }
        const existingRating = await this.rideRatingModel.findOne({
            ride: rideId,
            user: user._id,
        });
        if (existingRating) {
            throw new common_1.BadRequestException('This ride has already been rated by the user');
        }
        const newRating = new this.rideRatingModel({
            driver: ride.driver,
            user: user._id,
            ride: rideId,
            rating: ratingDto.rating,
            message: ratingDto.message,
        });
        await newRating.save();
        await this.rideModel.findByIdAndUpdate(rideId, { ratingId: newRating._id });
        await this.updateDriverRating(ride.driver._id);
        return new api_response_1.default(true, 'Ride rated successfully!', common_1.HttpStatus.OK, {
            rating: newRating,
        });
    }
};
exports.RideService = RideService;
exports.RideService = RideService = RideService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(ride_schema_1.Ride.name)),
    __param(1, (0, mongoose_2.InjectModel)(ride_schema_1.TemporaryRide.name)),
    __param(2, (0, mongoose_2.InjectModel)(user_schema_1.User.name)),
    __param(3, (0, mongoose_2.InjectModel)(rating_schma_1.RideRating.name)),
    __param(4, (0, mongoose_2.InjectModel)(DriverPaymentInfo_schema_1.DriverPayment.name)),
    __param(5, (0, mongoose_2.InjectModel)(driver_earnings_schema_1.DriverEarning.name)),
    __param(6, (0, mongoose_2.InjectModel)(payment_schema_1.Payment.name)),
    __metadata("design:paramtypes", [mongoose_1.Model,
        mongoose_1.Model,
        mongoose_1.Model,
        mongoose_1.Model,
        mongoose_1.Model,
        mongoose_1.Model,
        mongoose_1.Model,
        ride_gateway_1.RideGateway,
        payment_service_1.PaymentService,
        invoice_service_1.InvoiceService,
        cloudinary_service_1.CloudinaryService,
        driver_service_1.DriverService,
        mail_service_1.MailService])
], RideService);
//# sourceMappingURL=ride.service.js.map