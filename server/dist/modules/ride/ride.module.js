"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RideModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const ride_schema_1 = require("../../comman/schema/ride.schema");
const user_schema_1 = require("../../comman/schema/user.schema");
const ride_service_1 = require("./ride.service");
const ride_controller_1 = require("./ride.controller");
const ride_gateway_1 = require("./ride.gateway");
const auth_guards_1 = require("../../comman/guards/auth.guards");
const role_guards_1 = require("../../comman/guards/role.guards");
const ride_cron_service_1 = require("./ride.cron.service");
const payment_service_1 = require("../../comman/payment/payment.service");
const cloudinary_service_1 = require("../../comman/cloudinary/cloudinary.service");
const driver_module_1 = require("../driver/driver.module");
const driver_service_1 = require("../driver/driver.service");
const driver_earnings_schema_1 = require("../../comman/schema/driver-earnings.schema");
const payout_schema_1 = require("../../comman/schema/payout.schema");
let RideModule = class RideModule {
};
exports.RideModule = RideModule;
exports.RideModule = RideModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: ride_schema_1.Ride.name, schema: ride_schema_1.RideSchema },
                { name: ride_schema_1.TemporaryRide.name, schema: ride_schema_1.TemporaryRideSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: user_schema_1.VehicleDetails.name, schema: user_schema_1.vehicleDetailsSchema },
                { name: payout_schema_1.DriverPayout.name, schema: payout_schema_1.DriverPayoutSchema },
                { name: driver_earnings_schema_1.DriverEarnings.name, schema: driver_earnings_schema_1.DriverEarningsSchema },
            ]),
            driver_module_1.DriverModule
        ],
        controllers: [ride_controller_1.RideController],
        providers: [ride_service_1.RideService, ride_gateway_1.RideGateway, payment_service_1.PaymentService, auth_guards_1.AuthGuards, role_guards_1.RoleGuards, ride_cron_service_1.RideCronService, cloudinary_service_1.CloudinaryService, driver_service_1.DriverService],
    })
], RideModule);
//# sourceMappingURL=ride.module.js.map