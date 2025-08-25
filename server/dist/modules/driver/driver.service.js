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
exports.DriverService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const user_schema_1 = require("../../comman/schema/user.schema");
const mongoose_2 = require("mongoose");
const payout_schema_1 = require("../../comman/schema/payout.schema");
const driver_earnings_schema_1 = require("../../comman/schema/driver-earnings.schema");
const DriverPaymentInfo_schema_1 = require("../../comman/schema/DriverPaymentInfo.schema");
let DriverService = class DriverService {
    userModel;
    vehicleDetailsModel;
    driverPayoutModel;
    earningModel;
    driverPaymentModel;
    constructor(userModel, vehicleDetailsModel, driverPayoutModel, earningModel, driverPaymentModel) {
        this.userModel = userModel;
        this.vehicleDetailsModel = vehicleDetailsModel;
        this.driverPayoutModel = driverPayoutModel;
        this.earningModel = earningModel;
        this.driverPaymentModel = driverPaymentModel;
    }
    async setupDriverAccount(req, setupDriverAccountDto) {
        const driverId = req.user?._id;
        const driver = await this.userModel.findOne({ _id: driverId, role: 'driver' })
            .select("name _id contactNumber role createdAt profilePic");
        if (!driver)
            throw new common_1.UnauthorizedException('Driver not found!');
        const { coordinates, vehicleInfo } = setupDriverAccountDto;
        if (!coordinates || coordinates.length !== 2)
            throw new common_1.BadRequestException('Coordinates required!');
        if (!vehicleInfo?.type || !vehicleInfo?.numberPlate || !vehicleInfo?.model)
            throw new common_1.BadRequestException('Vehicle info required!');
        const session = await this.userModel.db.startSession();
        session.startTransaction();
        try {
            if (driver.vehicleDetails)
                await this.vehicleDetailsModel.findByIdAndDelete(driver.vehicleDetails, { session });
            const newVehicleDetails = await this.vehicleDetailsModel.create([{
                    type: vehicleInfo.type.toLowerCase(),
                    numberPlate: vehicleInfo.numberPlate.toLowerCase(),
                    model: vehicleInfo.model.toLowerCase(),
                }], { session });
            const newEarning = await this.earningModel.create([{
                    driverId,
                    rideId: null,
                    userId: null,
                    paymentId: null,
                    amount: 0,
                    status: driver_earnings_schema_1.EarningsStatus.PROCESSED,
                }], { session });
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
        }
        catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw new common_1.InternalServerErrorException('Failed to setup driver account: ' + error.message);
        }
    }
    async createPaymentAccount(req, dto) {
        const driverId = req.user?._id;
        const driver = await this.userModel.findOne({ _id: driverId, role: 'driver' });
        if (!driver)
            throw new common_1.UnauthorizedException('Driver not found!');
        if (!dto.method || !dto.accountNumber || !dto.accountHolderName)
            throw new common_1.BadRequestException('Required fields missing!');
        if (dto.method === 'bank' && !dto.ifsc)
            throw new common_1.BadRequestException('IFSC required for bank payout.');
        if (dto.isDefault) {
            await this.driverPayoutModel.updateMany({ driverId, isDefault: true }, { isDefault: false });
        }
        const payout = await new this.driverPayoutModel({
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
        const driverPaymentInfo = await new this.driverPaymentModel({
            driverId,
            payoutMethod: payout._id
        });
        await driverPaymentInfo.save();
        driver.payoutAccounts.push(payout._id);
        await driver.save();
        return { success: true, message: 'Driver payout account created', data: payout };
    }
    async recordDriverEarning(rideId, driverId, userId, paymentId, amount) {
        const earning = await this.earningModel.create({
            rideId,
            driverId,
            userId,
            paymentId,
            amount,
            status: driver_earnings_schema_1.EarningsStatus.PAID,
        });
        return earning;
    }
    async getDriverEarningsHistory(req, page = 1, limit = 10) {
        const driverId = req.user?._id;
        if (!driverId)
            throw new common_1.UnauthorizedException('Driver not authenticated');
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
    async getDriverEarnings(req) {
        const driverId = req.user?._id;
        if (!driverId)
            throw new common_1.UnauthorizedException('Driver not authenticated');
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
};
exports.DriverService = DriverService;
exports.DriverService = DriverService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.VehicleDetails.name)),
    __param(2, (0, mongoose_1.InjectModel)(payout_schema_1.DriverPayout.name)),
    __param(3, (0, mongoose_1.InjectModel)(driver_earnings_schema_1.DriverEarning.name)),
    __param(4, (0, mongoose_1.InjectModel)(DriverPaymentInfo_schema_1.DriverPayment.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], DriverService);
//# sourceMappingURL=driver.service.js.map