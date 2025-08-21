"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuardModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const user_schema_1 = require("../schema/user.schema");
const auth_guards_1 = require("./auth.guards");
const role_guards_1 = require("./role.guards");
let GuardModule = class GuardModule {
};
exports.GuardModule = GuardModule;
exports.GuardModule = GuardModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            jwt_1.JwtModule.registerAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    secret: config.get('ACCESS_TOKEN_SECRET'),
                    signOptions: { expiresIn: '1d' },
                }),
            }),
            mongoose_1.MongooseModule.forFeature([{ name: user_schema_1.User.name, schema: user_schema_1.UserSchema }]),
        ],
        providers: [auth_guards_1.AuthGuards, role_guards_1.RoleGuards],
        exports: [auth_guards_1.AuthGuards, role_guards_1.RoleGuards],
    })
], GuardModule);
//# sourceMappingURL=guads.module.js.map