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
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const ride_cron_service_1 = require("./ride.cron.service");
const payment_module_1 = require("../../comman/payment/payment.module");
const payment_service_1 = require("../../comman/payment/payment.service");
const invoice_module_1 = require("../../comman/invoice/invoice.module");
const cloudinary_module_1 = require("../../comman/cloudinary/cloudinary.module");
const cloudinary_service_1 = require("../../comman/cloudinary/cloudinary.service");
let RideModule = class RideModule {
};
exports.RideModule = RideModule;
exports.RideModule = RideModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            jwt_1.JwtModule.registerAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    secret: config.get('ACCESS_TOKEN_SECRET'),
                    signOptions: { expiresIn: '1d' },
                }),
            }),
            mongoose_1.MongooseModule.forFeature([
                { name: ride_schema_1.Ride.name, schema: ride_schema_1.RideSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: ride_schema_1.TemporaryRide.name, schema: ride_schema_1.TemporaryRideSchema }
            ]),
            payment_module_1.PaymentModule,
            invoice_module_1.InvoiceModule,
            cloudinary_module_1.CloudinaryModule
        ],
        controllers: [ride_controller_1.RideController],
        providers: [ride_service_1.RideService, ride_gateway_1.RideGateway, payment_service_1.PaymentService, auth_guards_1.AuthGuards, role_guards_1.RoleGuards, ride_cron_service_1.RideCronService, cloudinary_service_1.CloudinaryService],
    })
], RideModule);
//# sourceMappingURL=ride.module.js.map