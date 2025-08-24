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
const schedule_1 = require("@nestjs/schedule");
const comman_module_1 = require("./comman/comman.module");
const db_module_1 = require("./comman/db/db.module");
const guads_module_1 = require("./comman/guards/guads.module");
const user_module_1 = require("./modules/user/user.module");
const admin_module_1 = require("./modules/admin/admin.module");
const driver_module_1 = require("./modules/driver/driver.module");
const ride_module_1 = require("./modules/ride/ride.module");
const cloudinary_module_1 = require("./comman/cloudinary/cloudinary.module");
const sms_module_1 = require("./comman/sms/sms.module");
const payment_module_1 = require("./comman/payment/payment.module");
const invoice_module_1 = require("./comman/invoice/invoice.module");
const db_1 = require("./comman/db/db");
const mail_module_1 = require("./comman/mail/mail.module");
const otp_module_1 = require("./comman/otp/otp.module");
const token_module_1 = require("./comman/token/token.module");
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
            (0, db_1.default)(),
            db_module_1.DatabaseModule,
            comman_module_1.CommonModule,
            guads_module_1.GuardModule,
            user_module_1.UserModule,
            admin_module_1.AdminModule,
            driver_module_1.DriverModule,
            ride_module_1.RideModule,
            cloudinary_module_1.CloudinaryModule,
            sms_module_1.SmsModule,
            payment_module_1.PaymentModule,
            invoice_module_1.InvoiceModule,
            mail_module_1.MailModule,
            guads_module_1.GuardModule,
            otp_module_1.otpModule,
            token_module_1.TokenModule
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map