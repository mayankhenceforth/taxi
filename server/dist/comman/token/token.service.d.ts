import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import mongoose from 'mongoose';
export declare class TokenService {
    private configService;
    private jwtService;
    constructor(configService: ConfigService, jwtService: JwtService);
    generateAccessToken(_id: mongoose.Types.ObjectId): Promise<string>;
    generateRefreshToken(_id: mongoose.Types.ObjectId): Promise<string>;
    verifyRefeshToken(token: string): Promise<any>;
    verifyAccessToken(token: string): Promise<any>;
}
