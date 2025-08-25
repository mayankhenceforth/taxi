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
var RideCronService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RideCronService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const ride_schema_1 = require("../../comman/schema/ride.schema");
let RideCronService = RideCronService_1 = class RideCronService {
    tempRideModel;
    rideModel;
    logger = new common_1.Logger(RideCronService_1.name);
    constructor(tempRideModel, rideModel) {
        this.tempRideModel = tempRideModel;
        this.rideModel = rideModel;
    }
    async checkPendingRides() {
        const now = new Date();
        const ridesPendingDriver = await this.tempRideModel.find({
            createdAt: { $lte: new Date(now.getTime() - 2 * 60 * 1000) },
        });
        for (const ride of ridesPendingDriver) {
            this.logger.log(`Ride ${ride._id} has no driver after 1 minutes`);
        }
        const ridesToTerminate = await this.tempRideModel.find({
            createdAt: { $lte: new Date(now.getTime() - 6 * 60 * 1000) },
        });
        for (const ride of ridesToTerminate) {
            this.logger.log(`Terminating ride ${ride._id} due to no driver response in 3 minutes.`);
            await this.rideModel.findByIdAndUpdate(ride._id, {
                status: 'terminated',
            });
            await this.tempRideModel.findByIdAndDelete(ride._id);
            console.log(`Terminating ride ${ride._id} due to no driver response in 3 minutes.`);
        }
    }
    async checkRideStart() {
        const now = new Date();
        const ridesToStart = await this.rideModel.find({
            status: 'accepted',
            updatedAt: { $lte: new Date(now.getTime() - 30 * 60 * 1000) },
        }).populate('driver bookedBy');
        if (ridesToStart.length === 0) {
            this.logger.log(`No rides to start after 1 minutes of acceptance.`);
            return;
        }
        this.logger.log(`Checking for rides to start after 1 minutes of acceptance...`);
        for (const ride of ridesToStart) {
            this.logger.log(`Ride ${ride._id} is accepted but not started after 1 minutes.`);
            await this.rideModel.findByIdAndUpdate(ride._id, {
                status: 'started',
            });
            this.logger.log(`Ride ${ride._id} status updated to started.`);
            console.log(`Ride ${ride._id} status updated to started.`);
        }
    }
};
exports.RideCronService = RideCronService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RideCronService.prototype, "checkPendingRides", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RideCronService.prototype, "checkRideStart", null);
exports.RideCronService = RideCronService = RideCronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(ride_schema_1.TemporaryRide.name)),
    __param(1, (0, mongoose_1.InjectModel)(ride_schema_1.Ride.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], RideCronService);
//# sourceMappingURL=ride.cron.service.js.map