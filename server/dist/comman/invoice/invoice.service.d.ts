import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { RideDocument } from '../schema/ride.schema';
import { UserDocument } from '../schema/user.schema';
export declare class InvoiceService {
    private rideModel;
    private userModel;
    private readonly configService;
    constructor(rideModel: Model<RideDocument>, userModel: Model<UserDocument>, configService: ConfigService);
    generateInvoice(rideId: string): Promise<Buffer>;
    private generateQRCode;
    private formatCoordinates;
    private generateInvoiceNumber;
}
