import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { RideDocument } from '../schema/ride.schema';
import { UserDocument } from '../schema/user.schema';
export declare class InvoiceService {
    private rideModel;
    private userModel;
    private readonly configService;
    constructor(rideModel: Model<RideDocument>, userModel: Model<UserDocument>, configService: ConfigService);
    private dropLocationName;
    private pickupLocationName;
    generateInvoice(rideId: string): Promise<Buffer>;
    TotalIncome(filter: string): Promise<Buffer>;
    NewUsersReport(filter: string): Promise<Buffer>;
    NewRidesReport(filter: string): Promise<Buffer>;
    private generateQRCode;
    private generateInvoiceNumber;
}
