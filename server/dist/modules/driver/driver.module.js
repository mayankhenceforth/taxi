"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverModule = void 0;
const common_1 = require("@nestjs/common");
const driver_service_1 = require("./driver.service");
const driver_controller_1 = require("./driver.controller");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const auth_guards_1 = require("../../comman/guards/auth.guards");
const user_schema_1 = require("../../comman/schema/user.schema");
let DriverModule = class DriverModule {
};
exports.DriverModule = DriverModule;
exports.DriverModule = DriverModule = __decorate([
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
            mongoose_1.MongooseModule.forFeature([
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: user_schema_1.VehicleDetails.name, schema: user_schema_1.vehicleDetailsSchema },
            ]),
        ],
        controllers: [driver_controller_1.DriverController],
        providers: [driver_service_1.DriverService, auth_guards_1.AuthGuards],
    })
], DriverModule);
//# sourceMappingURL=driver.module.js.map