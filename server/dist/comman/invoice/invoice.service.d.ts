import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { RideDocument } from '../schema/ride.schema';
import { UserDocument } from '../schema/user.schema';
import { HtmlTemplateService } from './html-template.service';
import { PdfGeneratorService } from './pdf.service';
import { GeocodingService } from './geocoding.service';
export declare class InvoiceService {
    private rideModel;
    private userModel;
    private readonly configService;
    private readonly htmlTemplateService;
    private readonly pdfGeneratorService;
    private readonly geocodingService;
    constructor(rideModel: Model<RideDocument>, userModel: Model<UserDocument>, configService: ConfigService, htmlTemplateService: HtmlTemplateService, pdfGeneratorService: PdfGeneratorService, geocodingService: GeocodingService);
    private safePopulateRide;
    private extractUserDriverInfo;
    private generateQRCode;
    private generateInvoiceNumber;
    private generateReportNumber;
    generateInvoice(rideId: string): Promise<Buffer>;
    private generateInvoiceHtml;
    TotalIncome(filter: string): Promise<Buffer>;
    NewUsersReport(filter: string): Promise<Buffer>;
    NewRidesReport(filter: string): Promise<Buffer>;
    private generateReportData;
    private generateReportHtml;
    generateDriverInvoice(driverId: string, rideIds: string[]): Promise<Buffer>;
}
