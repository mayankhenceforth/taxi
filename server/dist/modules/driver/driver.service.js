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
let DriverService = class DriverService {
    userModel;
    vehicleDetailsModel;
    constructor(userModel, vehicleDetailsModel) {
        this.userModel = userModel;
        this.vehicleDetailsModel = vehicleDetailsModel;
    }
    async setupDriverAccount(req, setupDriverAccountDto) {
        const driverId = await req.user?._id;
        const driver = await this.userModel.findOne({
            _id: driverId,
            role: 'driver',
        }).select("name _id contactNumber role createdAt profilePic");
        console.log("driver Infomation", driver);
        if (!driver) {
            throw new common_1.UnauthorizedException('Driver not found!');
        }
        console.log(driver);
        const { coordinates, vehicleInfo } = setupDriverAccountDto;
        if (!coordinates ||
            !Array.isArray(coordinates) ||
            coordinates.length !== 2) {
            throw new common_1.BadRequestException('Coordinates are required!');
        }
        if (!vehicleInfo ||
            !vehicleInfo?.type ||
            !vehicleInfo?.numberPlate ||
            !vehicleInfo?.model) {
            throw new common_1.BadRequestException('Vehicle info is required!');
        }
        if (driver?.vehicleDetails) {
            await this.vehicleDetailsModel.findByIdAndDelete(driver?.vehicleDetails);
        }
        const newVehicleDetails = await this.vehicleDetailsModel.create({
            type: vehicleInfo?.type,
            numberPlate: vehicleInfo?.numberPlate,
            model: vehicleInfo?.model,
        });
        const updatedDriverInfo = await this.userModel
            .findByIdAndUpdate(driverId, {
            $set: {
                location: {
                    type: 'Point',
                    coordinates,
                },
                vehicleDetails: newVehicleDetails?._id,
            },
        }, {
            new: true,
        })
            .populate('vehicleDetails')
            .select('location vehicleDetails name email contactNumber isEmailVerified isContactNumberVerified profilePic role');
        return {
            message: "Driver setUp Successfuly",
            data: updatedDriverInfo
        };
    }
};
exports.DriverService = DriverService;
exports.DriverService = DriverService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.VehicleDetails.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], DriverService);
//# sourceMappingURL=driver.service.js.map