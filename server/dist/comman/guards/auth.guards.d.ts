import { CanActivate, ExecutionContext } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Model } from "mongoose";
import { UserDocument } from "../schema/user.schema";
export declare class AuthGuards implements CanActivate {
    private jwtService;
    private configService;
    private userModel;
    constructor(jwtService: JwtService, configService: ConfigService, userModel: Model<UserDocument>);
    private extractTokenFromHeader;
    canActivate(context: ExecutionContext): Promise<boolean>;
}
