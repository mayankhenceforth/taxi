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
let DriverService = class DriverService {
    userModel;
    vehicleDetailsModel;
    DriverPayOutModel;
    earningModel;
    constructor(userModel, vehicleDetailsModel, DriverPayOutModel, earningModel) {
        this.userModel = userModel;
        this.vehicleDetailsModel = vehicleDetailsModel;
        this.DriverPayOutModel = DriverPayOutModel;
        this.earningModel = earningModel;
    }
    async setupDriverAccount(req, setupDriverAccountDto) {
        const driverId = req.user?._id;
        const driver = await this.userModel.findOne({
            _id: driverId,
            role: 'driver',
        }).select("name _id contactNumber role createdAt profilePic");
        if (!driver) {
            throw new common_1.UnauthorizedException('Driver not found!');
        }
        const { coordinates, vehicleInfo } = setupDriverAccountDto;
        if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
            throw new common_1.BadRequestException('Coordinates are required!');
        }
        if (!vehicleInfo || !vehicleInfo?.type || !vehicleInfo?.numberPlate || !vehicleInfo?.model) {
            throw new common_1.BadRequestException('Vehicle info is required!');
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
                        type: driver_earnings_schema_1.EarningsType.RIDE,
                        amount: 0,
                        description: 'Initial earnings document',
                        status: driver_earnings_schema_1.EarningsStatus.PROCESSED,
                        totalEarnings: 0,
                        totalRides: 0,
                        availableBalance: 0,
                        paidBalance: 0,
                    }], { session });
                earningsDoc = newEarnings[0];
            }
            const updatedDriverInfo = await this.userModel
                .findByIdAndUpdate(driverId, {
                $set: {
                    location: {
                        type: 'Point',
                        coordinates,
                    },
                    vehicleDetails: newVehicleDetails[0]._id,
                    earnings: earningsDoc._id,
                },
            }, {
                new: true,
                session,
            })
                .populate('vehicleDetails earnings')
                .select('location vehicleDetails earnings name email contactNumber isEmailVerified isContactNumberVerified profilePic role');
            await session.commitTransaction();
            session.endSession();
            return {
                message: "Driver setup successfully",
                data: updatedDriverInfo
            };
        }
        catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw new common_1.InternalServerErrorException('Failed to setup driver account: ' + error.message);
        }
    }
    async createPaymentAccount(req, createDriverPayoutDto) {
        const driverId = req.user?._id;
        const driver = await this.userModel.findOne({
            _id: driverId,
            role: 'driver',
        }).populate('vehicleDetails earnings');
        if (!driver) {
            throw new common_1.UnauthorizedException('Driver not found!');
        }
        const { method, accountNumber, ifsc, accountHolderName, nickname, isDefault } = createDriverPayoutDto;
        if (!method || !accountNumber || !accountHolderName) {
            throw new common_1.BadRequestException('Method, account number, and account holder name are required!');
        }
        if (method === 'bank' && !ifsc) {
            throw new common_1.BadRequestException('IFSC code is required for BANK payout method.');
        }
        if (isDefault) {
            await this.DriverPayOutModel.updateMany({ driverId, isDefault: true }, { isDefault: false });
        }
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
        if (!Array.isArray(driver.payoutAccounts)) {
            driver.payoutAccounts = [];
        }
        driver.payoutAccounts.push(payoutAccount._id);
        await driver.save();
        return {
            success: true,
            message: 'Driver payout account created successfully',
            data: payoutAccount,
        };
    }
    async updateDriverEarnings(rideId, driverId, amount) {
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
        }
        catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw new common_1.InternalServerErrorException('Failed to update driver earnings: ' + error.message);
        }
    }
    async getDriverEarnings(req) {
        const driverId = req.user?._id;
        if (!driverId) {
            throw new common_1.UnauthorizedException('Driver not authenticated');
        }
        const driver = await this.userModel.findById(driverId);
        if (!driver) {
            throw new common_1.NotFoundException('Driver not found');
        }
        if (!driver.earnings) {
            throw new common_1.NotFoundException('Earnings record not found for this driver');
        }
        const earnings = await this.earningModel.findById(driver.earnings);
        if (!earnings) {
            throw new common_1.NotFoundException('Earnings details not found');
        }
        return {
            success: true,
            message: 'Driver earnings retrieved successfully',
            data: earnings
        };
    }
    async getDriverEarningsHistory(req, page = 1, limit = 10) {
        const driverId = req.user?._id;
        if (!driverId) {
            throw new common_1.UnauthorizedException('Driver not authenticated');
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
};
exports.DriverService = DriverService;
exports.DriverService = DriverService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.VehicleDetails.name)),
    __param(2, (0, mongoose_1.InjectModel)(payout_schema_1.DriverPayout.name)),
    __param(3, (0, mongoose_1.InjectModel)(driver_earnings_schema_1.DriverEarnings.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], DriverService);
//# sourceMappingURL=driver.service.js.map