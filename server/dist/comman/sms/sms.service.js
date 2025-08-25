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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const twilio_1 = require("twilio");
let SmsService = class SmsService {
    configService;
    twilioClient;
    constructor(configService) {
        this.configService = configService;
        this.twilioClient = new twilio_1.Twilio(this.configService.get('TWILIO_ACCOUNT_SID'), this.configService.get('TWILIO_AUTH_TOKEN'));
    }
    async sendSms(body) {
        return await this.twilioClient.messages.create({
            from: this.configService.get('TWILIO_PHONE_NUMBER'),
            to: this.configService.get('TWILIO_MY_NUMBER'),
            body,
        });
    }
    async sendLoginOtpSms(otp) {
        return this.sendSms(`Dear user, your otp for login to your account is : ${otp}`);
    }
    async sendVerificationOtpSms(otp) {
        return this.sendSms(`Dear user, your otp to verify your account is : ${otp}`);
    }
    async sendForgetPasswordOtpSms(otp) {
        return this.sendSms(`Dear user, your otp to reset your password is : ${otp}`);
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SmsService);
//# sourceMappingURL=sms.service.js.map