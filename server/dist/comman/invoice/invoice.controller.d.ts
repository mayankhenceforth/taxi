import { InvoiceService } from './invoice.service';
import { Response } from 'express';
export declare class InvoiceController {
    private readonly invoiceService;
    constructor(invoiceService: InvoiceService);
    getInvoice(rideId: string, res: Response): Promise<void>;
}
