import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import ConfigureDB from "./db/db";
import { PendingUser, PendingUserSchema, User, UserSchema } from "./schema/user.schema";
import { TokenModule } from './token/token.module';
import { otpModule } from "./otp/otp.module";
import { SmsModule } from "./sms/sms.module";
import { PaymentModule } from './payment/payment.module';
import { InvoiceModule } from './invoice/invoice.module';


@Global()
@Module({
    imports: [
        ConfigureDB(),
        MongooseModule.forFeature([{
            name: User.name,
            schema: UserSchema
        },
        {
            name: PendingUser.name,
            schema: PendingUserSchema
        }]),
        TokenModule,
        otpModule,
        SmsModule,
        PaymentModule,
        InvoiceModule,
    
        
    ],
    exports: [MongooseModule]
})
export class CommonModule { }