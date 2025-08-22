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
exports.InvoiceController = void 0;
const common_1 = require("@nestjs/common");
const invoice_service_1 = require("./invoice.service");
let InvoiceController = class InvoiceController {
    invoiceService;
    constructor(invoiceService) {
        this.invoiceService = invoiceService;
    }
    async getInvoice(rideId, res) {
        const pdfBuffer = await this.invoiceService.generateInvoice(rideId);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="invoice_${rideId}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });
        res.end(pdfBuffer);
    }
    async getTotalIncome(filter, res) {
        const pdfBuffer = await this.invoiceService.TotalIncome(filter);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="total-income-${filter || 'all'}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });
        res.end(pdfBuffer);
    }
    async getNewUser(filter, res) {
        const pdfBuffer = await this.invoiceService.NewUsersReport(filter);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="total-income-${filter || 'all'}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });
        res.end(pdfBuffer);
    }
    async getNewRides(filter, res) {
        const pdfBuffer = await this.invoiceService.NewRidesReport(filter);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="total-income-${filter || 'all'}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });
        res.end(pdfBuffer);
    }
};
exports.InvoiceController = InvoiceController;
__decorate([
    (0, common_1.Get)('ride/:rideId'),
    __param(0, (0, common_1.Param)('rideId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InvoiceController.prototype, "getInvoice", null);
__decorate([
    (0, common_1.Get)('totalIncome'),
    __param(0, (0, common_1.Query)('filter')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InvoiceController.prototype, "getTotalIncome", null);
__decorate([
    (0, common_1.Get)('newUser'),
    __param(0, (0, common_1.Query)('filter')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InvoiceController.prototype, "getNewUser", null);
__decorate([
    (0, common_1.Get)('newRides'),
    __param(0, (0, common_1.Query)('filter')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InvoiceController.prototype, "getNewRides", null);
exports.InvoiceController = InvoiceController = __decorate([
    (0, common_1.Controller)('invoice'),
    __metadata("design:paramtypes", [invoice_service_1.InvoiceService])
], InvoiceController);
//# sourceMappingURL=invoice.controller.js.map