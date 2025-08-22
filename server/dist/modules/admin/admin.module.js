"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const admin_controller_1 = require("./admin.controller");
const jwt_1 = require("@nestjs/jwt");
const mongoose_1 = require("@nestjs/mongoose");
const ride_schema_1 = require("../../comman/schema/ride.schema");
const user_schema_1 = require("../../comman/schema/user.schema");
const cloudinary_module_1 = require("../../comman/cloudinary/cloudinary.module");
const invoice_module_1 = require("../../comman/invoice/invoice.module");
const invoice_service_1 = require("../../comman/invoice/invoice.service");
const payment_module_1 = require("../../comman/payment/payment.module");
const payment_service_1 = require("../../comman/payment/payment.service");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            jwt_1.JwtModule.register({ secret: process.env.JWT_SECRET }),
            mongoose_1.MongooseModule.forFeature([
                { name: ride_schema_1.Ride.name, schema: ride_schema_1.RideSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: ride_schema_1.TemporaryRide.name, schema: ride_schema_1.TemporaryRideSchema }
            ]),
            cloudinary_module_1.CloudinaryModule,
            invoice_module_1.InvoiceModule,
            payment_module_1.PaymentModule
        ],
        controllers: [admin_controller_1.AdminController],
        providers: [admin_service_1.AdminService, invoice_service_1.InvoiceService, payment_service_1.PaymentService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map