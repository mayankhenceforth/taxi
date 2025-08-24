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
const ride_controller_1 = require("./ride.controller");
const ride_service_1 = require("./ride.service");
const ride_gateway_1 = require("./ride.gateway");
const ride_cron_service_1 = require("./ride.cron.service");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const driver_module_1 = require("../driver/driver.module");
const invoice_module_1 = require("../../comman/invoice/invoice.module");
const cloudinary_module_1 = require("../../comman/cloudinary/cloudinary.module");
const payment_module_1 = require("../../comman/payment/payment.module");
const mail_module_1 = require("../../comman/mail/mail.module");
let RideModule = class RideModule {
};
exports.RideModule = RideModule;
exports.RideModule = RideModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    secret: config.get('ACCESS_TOKEN_SECRET'),
                    signOptions: { expiresIn: '1d' },
                }),
            }),
            driver_module_1.DriverModule,
            invoice_module_1.InvoiceModule,
            cloudinary_module_1.CloudinaryModule,
            payment_module_1.PaymentModule,
            mail_module_1.MailModule,
        ],
        controllers: [ride_controller_1.RideController],
        providers: [
            ride_service_1.RideService,
            ride_gateway_1.RideGateway,
            ride_cron_service_1.RideCronService,
        ],
    })
], RideModule);
//# sourceMappingURL=ride.module.js.map