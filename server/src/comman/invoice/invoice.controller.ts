import { Controller, Get, Param, Res } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { Response } from 'express';

@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get('ride/:rideId')
  async getInvoice(@Param('rideId') rideId: string, @Res() res: Response) {
    const pdfBuffer = await this.invoiceService.generateInvoice(rideId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice_${rideId}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
