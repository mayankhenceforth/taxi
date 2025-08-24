import { Injectable } from '@nestjs/common';

@Injectable()
export class HtmlTemplateService {
  private readonly imageUrl = "https://res.cloudinary.com/dmedhsl41/image/upload/v1755751596/360_F_471467270_wdaTtaF6QWhqILrY0LGUZvpIXOtVEgGP-removebg-preview_g3rsyw.png";
  private readonly companyInfo = {
    name: "RideShare Pro",
    address: "123 Ride Street, City Center",
    phone: "+91 9876543210",
    email: "support@rideshare.com",
    gstin: "27ABCDE1234F1Z5"
  };

  generateInvoiceHeader(title: string, invoiceNo: string, additionalInfo?: string): string {
    return `
      <div class="header">
        <div class="company-info">
          <div class="logo-container">
            <div class="logo"><img src="${this.imageUrl}" class='logoImage' /></div>
            <img src="${this.imageUrl}" class="watermark" />
            <div class="company-name">${this.companyInfo.name}</div>
            <div class="company-details">
              <div>${this.companyInfo.address}</div>
              <div>${this.companyInfo.phone} • ${this.companyInfo.email}</div>
              <div>GSTIN: ${this.companyInfo.gstin}</div>
            </div>
          </div>
        </div>
        <div class="invoice-info">
          <div style="font-weight: bold; font-size: 16px;">${title}</div>
          <div class="compact"><strong>Invoice No:</strong> ${invoiceNo}</div>
          <div class="compact"><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</div>
          <div class="compact"><strong>Time:</strong> ${new Date().toLocaleTimeString('en-IN')}</div>
          ${additionalInfo || ''}
        </div>
      </div>
    `;
  }

  generateReportHeader(title: string, reportNo: string): string {
    return `
      <div class="header">
        <div class="company-info">
          <div class="logo-container">
            <div class="logo"><img src="${this.imageUrl}" style="width:100%; height:100%;" /></div>
            <img src="${this.imageUrl}" class="watermark" />
            <div>
              <div class="company-name">${this.companyInfo.name}</div>
              <div class="company-details">
                <div>${this.companyInfo.address}</div>
                <div>${this.companyInfo.phone} • ${this.companyInfo.email}</div>
                <div>GSTIN: ${this.companyInfo.gstin}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="invoice-info">
          <div style="font-weight: bold; font-size: 16px;">${title}</div>
          <div><strong>Report No:</strong> ${reportNo}</div>
          <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</div>
          <div><strong>Time:</strong> ${new Date().toLocaleTimeString('en-IN')}</div>
        </div>
      </div>
    `;
  }

  generateFooter(): string {
    return `
      <div class="footer">
        <div>Thank you for choosing ${this.companyInfo.name}!</div>
        <div>This is a computer-generated invoice • www.rideshare.com</div>
        <div>For queries: ${this.companyInfo.email} • ${this.companyInfo.phone}</div>
      </div>
    `;
  }

  generateBaseStyles(primaryColor: string = "#fcad02dc", watermarkOpacity: string = "0.20"): string {
    return `
      body { font-family: 'Helvetica', Arial, sans-serif; margin: 15px; font-size: 12px; color: #333; text-transform: capitalize;
; }
      .container { max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid ${primaryColor}; padding-bottom: 15px; }
      .company-info { flex: 2; }
      .company-name { font-size: 20px; font-weight: bold; color: ${primaryColor}; margin-bottom: 5px; }
      .company-details { font-size: 11px; color: #666; }
      .invoice-info { flex: 1; text-align: right; }
      .invoice-title { text-align: center; margin: 15px 0; font-size: 18px; font-weight: bold; color: ${primaryColor}; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
      table, th, td { border: 1px solid #ddd; }
      th, td { padding: 6px; text-align: left; }
      th { background-color: #f8f9fa; font-weight: bold; }
      .right { text-align: right; }
      .total { font-weight: bold; background-color: #e6f7ff; }
      .positive { color: #28a745; }
      .negative { color: #dc3545; }
      .amount-in-words { margin-top: 12px; font-style: italic; font-size: 11px; padding: 8px; background-color: #f9f9f9; border-left: 3px solid ${primaryColor}; }
      .section { margin-top: 15px; }
      .section h3 { margin: 0 0 8px 0; font-size: 13px; color: ${primaryColor}; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
      .logo-container { display: flex; align-items: center; margin-bottom: 10px; }
      .logo { width: 60px; height: 60px; background-color: ${primaryColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px; margin-right: 12px; }
      .qr-code { width: 150px; height: 150px; margin-top: 10px; }
      .footer { margin-top: 25px; text-align: center; font-size: 10px; color: #888; border-top: 1px solid #ddd; padding-top: 10px; }
      .signature { margin-top: 30px; border-top: 1px dashed #ddd; padding-top: 10px; font-size: 11px; }
      .compact { margin: 5px 0; }
      .text-xs { font-size: 10px; }
      .watermark { position: fixed; top: 50%; left: 50%; width: 350px; height: 350px; opacity: ${watermarkOpacity}; transform: translate(-50%, -50%); z-index: 0; pointer-events: none; }
      .logoImage { width: 100%; height: 100%; object-fit: cover; }
      .earnings-breakdown { background-color: #f8f9fa; padding: 10px; border-radius: 5px; margin-top: 15px; }
    `;
  }
}