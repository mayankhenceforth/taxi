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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthGuards = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../schema/user.schema");
let AuthGuards = class AuthGuards {
    jwtService;
    configService;
    userModel;
    constructor(jwtService, configService, userModel) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.userModel = userModel;
    }
    extractTokenFromHeader(request) {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer '))
            return undefined;
        return authHeader.replace('Bearer ', '');
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        if (!token)
            throw new common_1.UnauthorizedException("Token is required");
        try {
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('ACCESS_TOKEN_SECRET')
            });
            const user = await this.userModel.findById(payload?._id);
            if (!user) {
                throw new Error();
            }
            request['user'] = user;
            return true;
        }
        catch (error) {
            throw new common_1.UnauthorizedException("User not authorized!!!");
        }
    }
};
exports.AuthGuards = AuthGuards;
exports.AuthGuards = AuthGuards = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        mongoose_2.Model])
], AuthGuards);
//# sourceMappingURL=auth.guards.js.map