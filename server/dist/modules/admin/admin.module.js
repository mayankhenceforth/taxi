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
const admin_controller_1 = require("./admin.controller");
const admin_service_1 = require("./admin.service");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const cloudinary_module_1 = require("../../comman/cloudinary/cloudinary.module");
const invoice_module_1 = require("../../comman/invoice/invoice.module");
const payment_module_1 = require("../../comman/payment/payment.module");
const invoice_service_1 = require("../../comman/invoice/invoice.service");
const payment_service_1 = require("../../comman/payment/payment.service");
const html_template_service_1 = require("../../comman/invoice/html-template.service");
const pdf_service_1 = require("../../comman/invoice/pdf.service");
const geocoding_service_1 = require("../../comman/invoice/geocoding.service");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    secret: config.get('JWT_SECRET'),
                }),
            }),
            cloudinary_module_1.CloudinaryModule,
            invoice_module_1.InvoiceModule,
            payment_module_1.PaymentModule
        ],
        controllers: [admin_controller_1.AdminController],
        providers: [
            admin_service_1.AdminService,
            invoice_service_1.InvoiceService,
            payment_service_1.PaymentService,
            html_template_service_1.HtmlTemplateService,
            pdf_service_1.PdfGeneratorService,
            geocoding_service_1.GeocodingService,
        ],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map