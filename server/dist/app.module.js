"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const comman_module_1 = require("./comman/comman.module");
const db_1 = require("./comman/db/db");
const user_module_1 = require("./modules/user/user.module");
const cloudinary_module_1 = require("./comman/cloudinary/cloudinary.module");
const admin_module_1 = require("./modules/admin/admin.module");
const driver_module_1 = require("./modules/driver/driver.module");
const sms_module_1 = require("./comman/sms/sms.module");
const guads_module_1 = require("./comman/guards/guads.module");
const ride_module_1 = require("./modules/ride/ride.module");
const schedule_1 = require("@nestjs/schedule");
const payment_module_1 = require("./comman/payment/payment.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env'
            }),
            schedule_1.ScheduleModule.forRoot(),
            comman_module_1.CommonModule,
            (0, db_1.default)(),
            user_module_1.UserModule,
            cloudinary_module_1.CloudinaryModule,
            ride_module_1.RideModule,
            admin_module_1.AdminModule,
            driver_module_1.DriverModule,
            sms_module_1.SmsModule,
            guads_module_1.GuardModule,
            payment_module_1.PaymentModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map