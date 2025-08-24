"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const db_1 = require("./db/db");
const user_schema_1 = require("./schema/user.schema");
const token_module_1 = require("./token/token.module");
const otp_module_1 = require("./otp/otp.module");
const sms_module_1 = require("./sms/sms.module");
const payment_module_1 = require("./payment/payment.module");
const invoice_module_1 = require("./invoice/invoice.module");
const mail_module_1 = require("./mail/mail.module");
let CommonModule = class CommonModule {
};
exports.CommonModule = CommonModule;
exports.CommonModule = CommonModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            (0, db_1.default)(),
            mongoose_1.MongooseModule.forFeature([{
                    name: user_schema_1.User.name,
                    schema: user_schema_1.UserSchema
                },
                {
                    name: user_schema_1.PendingUser.name,
                    schema: user_schema_1.PendingUserSchema
                }]),
            token_module_1.TokenModule,
            otp_module_1.otpModule,
            sms_module_1.SmsModule,
            payment_module_1.PaymentModule,
            invoice_module_1.InvoiceModule,
            mail_module_1.MailModule
        ],
        exports: [mongoose_1.MongooseModule]
    })
], CommonModule);
//# sourceMappingURL=comman.module.js.map