
import { Controller, Get, Param, Query, Res } from '@nestjs/common';
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

 @Get('totalIncome')
async getTotalIncome(
  @Query('filter') filter: string, // "1h", "1d", "1w", "1m"
  @Res() res: Response,
) {
  const pdfBuffer = await this.invoiceService.TotalIncome(filter);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="total-income-${filter || 'all'}.pdf"`,
    'Content-Length': pdfBuffer.length,
  });

  res.end(pdfBuffer);
}


 @Get('newUser')
async getNewUser(
  @Query('filter') filter: string, // "1h", "1d", "1w", "1m"
  @Res() res: Response,
) {
  const pdfBuffer = await this.invoiceService.NewUsersReport(filter);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="total-income-${filter || 'all'}.pdf"`,
    'Content-Length': pdfBuffer.length,
  });

  res.end(pdfBuffer);
}

 @Get('newRides')
async getNewRides(
  @Query('filter') filter: string, // "1h", "1d", "1w", "1m"
  @Res() res: Response,
) {
  const pdfBuffer = await this.invoiceService.NewRidesReport(filter);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="total-income-${filter || 'all'}.pdf"`,
    'Content-Length': pdfBuffer.length,
  });

  res.end(pdfBuffer);


}

}