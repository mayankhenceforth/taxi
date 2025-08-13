import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import ConfigureDB from "./db/db";
import { User, UserSchema } from "./schema/user.schema";
import { TokenModule } from './token/token.module';

@Global()
@Module({
    imports: [
        ConfigureDB(),
        MongooseModule.forFeature([{
            name:User.name,
            schema:UserSchema
        }]),
        TokenModule
    ],
    exports: [MongooseModule]
})
export class CommonModule { }