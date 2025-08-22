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
exports.InvoiceService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const config_1 = require("@nestjs/config");
const number_to_words_1 = require("number-to-words");
const QRCode = require("qrcode");
const ride_schema_1 = require("../schema/ride.schema");
const user_schema_1 = require("../schema/user.schema");
const html_template_service_1 = require("./html-template.service");
const pdf_service_1 = require("./pdf.service");
const geocoding_service_1 = require("./geocoding.service");
let InvoiceService = class InvoiceService {
    rideModel;
    userModel;
    configService;
    htmlTemplateService;
    pdfGeneratorService;
    geocodingService;
    constructor(rideModel, userModel, configService, htmlTemplateService, pdfGeneratorService, geocodingService) {
        this.rideModel = rideModel;
        this.userModel = userModel;
        this.configService = configService;
        this.htmlTemplateService = htmlTemplateService;
        this.pdfGeneratorService = pdfGeneratorService;
        this.geocodingService = geocodingService;
    }
    async safePopulateRide(rideId) {
        const objectId = new mongoose_2.Types.ObjectId(rideId);
        let ride = await this.rideModel
            .findById(objectId)
            .populate('bookedBy', 'name email contactNumber')
            .populate({
            path: 'driver',
            select: 'name contactNumber',
            populate: {
                path: 'vehicleDetails',
                model: 'VehicleDetails',
                select: 'type model numberPlate'
            }
        })
            .exec();
        if (!ride)
            throw new Error('Ride not found');
        if (!ride.bookedBy || typeof ride.bookedBy === 'string') {
            const user = await this.userModel.findById(ride.bookedBy).select('name email contactNumber').exec();
            ride.bookedBy = user;
        }
        if (!ride.driver || typeof ride.driver === 'string') {
            const driver = await this.userModel.findById(ride.driver)
                .populate('vehicleDetails', 'type model numberPlate')
                .select('name contactNumber')
                .exec();
            ride.driver = driver;
        }
        return ride;
    }
    extractUserDriverInfo(ride) {
        const user = ride.bookedBy;
        const driver = ride.driver;
        if (!user)
            throw new Error('User not found');
        if (!driver)
            throw new Error('Driver not found');
        return {
            userName: user?.name || 'N/A',
            userContact: user?.contactNumber || 'N/A',
            userEmail: user?.email || 'N/A',
            driverName: driver?.name || 'N/A',
            driverContact: driver?.contactNumber || 'N/A',
            vehicleType: (driver?.vehicleDetails?.type || 'N/A').toUpperCase(),
            vehicleModel: driver?.vehicleDetails?.model || 'N/A',
            vehicleNumber: driver?.vehicleDetails?.numberPlate || 'N/A',
        };
    }
    async generateQRCode(data) {
        const qrText = `
Ride ID: ${data.rideId || 'N/A'}
Status: ${data.status || 'N/A'}
Total Fare: ₹${data.totalFare?.toFixed(2) || '0.00'}
Payment Status: ${data.paymentStatus || 'N/A'}
${data.refundStatus ? `Refund Status: ${data.refundStatus}` : ''}
${data.refundAmount ? `Refund Amount: ₹${data.refundAmount.toFixed(2)}` : ''}
Date: ${new Date().toLocaleDateString('en-IN')}
Time: ${new Date().toLocaleTimeString('en-IN')}
    `.trim();
        return await QRCode.toDataURL(qrText, {
            width: 250,
            margin: 2,
            color: { dark: '#e7a20cff', light: '#ffffff' },
        });
    }
    generateInvoiceNumber(rideId) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `INV-${year}${month}${day}-${rideId}`;
    }
    generateReportNumber(prefix, filter) {
        const now = new Date();
        return `${prefix}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${filter || 'ALL'}`;
    }
    async generateInvoice(rideId) {
        try {
            if (!rideId)
                throw new common_1.BadRequestException("ride id requerde");
            const ride = await this.safePopulateRide(rideId);
            const userDriverInfo = this.extractUserDriverInfo(ride);
            const [pickupLocationName, dropLocationName] = await Promise.all([
                this.geocodingService.reverseGeocode(ride.pickupLocation.coordinates[0], ride.pickupLocation.coordinates[1]),
                this.geocodingService.reverseGeocode(ride.dropoffLocation.coordinates[0], ride.dropoffLocation.coordinates[1])
            ]);
            const qrCodeData = await this.generateQRCode({
                rideId: ride._id,
                totalFare: ride.TotalFare,
                status: ride.status,
                paymentStatus: ride.paymentStatus,
                refundStatus: ride.refundStatus,
                refundAmount: ride.refundAmount
            });
            const totalInWords = (0, number_to_words_1.toWords)(Math.round(ride.TotalFare));
            const invoiceNo = this.generateInvoiceNumber(rideId);
            const html = this.generateInvoiceHtml({
                ride,
                user: userDriverInfo,
                driver: userDriverInfo,
                pickupLocationName,
                dropLocationName,
                qrCodeData,
                totalInWords,
                invoiceNo
            });
            return await this.pdfGeneratorService.generatePdfFromHtml(html);
        }
        catch (error) {
            console.error('Error generating invoice:', error);
            throw new Error(`Failed to generate invoice: ${error.message}`);
        }
    }
    generateInvoiceHtml(data) {
        const { ride, user, driver, pickupLocationName, dropLocationName, qrCodeData, totalInWords, invoiceNo } = data;
        return `
      <html>
      <head>
        <style>${this.htmlTemplateService.generateBaseStyles()}</style>
      </head>
      <body>
        <div class="container">
          ${this.htmlTemplateService.generateInvoiceHeader('TAXI INVOICE', invoiceNo, `<div class="compact"><strong>Payment Status:</strong> <span style="color: ${ride.paymentStatus === 'paid' ? 'green' : 'red'};">${(ride.paymentStatus || 'N/A').toUpperCase()}</span></div>`)}
          <!-- Rest of your invoice content -->
          ${this.htmlTemplateService.generateFooter()}
        </div>
      </body>
      </html>
    `;
    }
    async TotalIncome(filter) {
        const reportData = await this.generateReportData('income', filter);
        const html = this.generateReportHtml(reportData);
        return await this.pdfGeneratorService.generatePdfFromHtml(html);
    }
    async NewUsersReport(filter) {
        const reportData = await this.generateReportData('users', filter);
        const html = this.generateReportHtml(reportData);
        return await this.pdfGeneratorService.generatePdfFromHtml(html);
    }
    async NewRidesReport(filter) {
        const reportData = await this.generateReportData('rides', filter);
        const html = this.generateReportHtml(reportData);
        return await this.pdfGeneratorService.generatePdfFromHtml(html);
    }
    async generateReportData(type, filter) {
        return { total: 0, items: [], type, filter };
    }
    generateReportHtml(data) {
        return '';
    }
};
exports.InvoiceService = InvoiceService;
exports.InvoiceService = InvoiceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(ride_schema_1.Ride.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        config_1.ConfigService,
        html_template_service_1.HtmlTemplateService,
        pdf_service_1.PdfGeneratorService,
        geocoding_service_1.GeocodingService])
], InvoiceService);
//# sourceMappingURL=invoice.service.js.map