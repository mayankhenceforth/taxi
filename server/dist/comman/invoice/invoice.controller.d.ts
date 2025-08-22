import { InvoiceService } from './invoice.service';
import { Response } from 'express';
export declare class InvoiceController {
    private readonly invoiceService;
    constructor(invoiceService: InvoiceService);
    getInvoice(rideId: string, res: Response): Promise<void>;
    getTotalIncome(filter: string, res: Response): Promise<void>;
    getNewUser(filter: string, res: Response): Promise<void>;
    getNewRides(filter: string, res: Response): Promise<void>;
}
