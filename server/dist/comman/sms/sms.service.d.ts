import { ConfigService } from '@nestjs/config';
export declare class SmsService {
    private configService;
    private twilioClient;
    constructor(configService: ConfigService);
    private sendSms;
    sendLoginOtpSms(otp: number): Promise<any>;
    sendVerificationOtpSms(otp: number): Promise<any>;
    sendForgetPasswordOtpSms(otp: number): Promise<any>;
}
