import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as puppeteer from 'puppeteer';
import { toWords } from 'number-to-words';
import * as QRCode from 'qrcode';
import { Ride, RideDocument } from '../schema/ride.schema';
import { User, UserDocument } from '../schema/user.schema';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel(Ride.name) private rideModel: Model<RideDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
  ) {}

  async generateInvoice(rideId: string): Promise<Buffer> {
    const objectId = new Types.ObjectId(rideId);
    const ride = await this.rideModel.findById(objectId).populate('bookedBy driver');
    if (!ride) throw new Error('Ride not found');

    const user = ride.bookedBy as any;
    const driver = ride.driver as any;

    const perKmFare = Number(this.configService.get<string>('RIDE_FARE')) || 15;
    const gstPercent = Number(this.configService.get<string>('Ride_FARE_GST')) || 18;

    const distanceFare = (ride.distance || 0) * perKmFare;
    const tax = distanceFare * (gstPercent / 100);
    const totalFare = distanceFare + tax;
    const totalInWords = toWords(Math.round(totalFare));

    // Generate QR code with ride details
    const qrCodeData = await this.generateQRCode({ ...ride.toObject(), totalFare });

    const rideIdString = rideId;
    const shortRideId = rideIdString;

    const html = `
    <html>
    <head>
      <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; margin: 15px; font-size: 12px; line-height: 1.4; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #2c5282; padding-bottom: 15px; }
        .company-info { flex: 2; }
        .company-name { font-size: 20px; font-weight: bold; color: #2c5282; margin-bottom: 5px; }
        .company-details { font-size: 11px; color: #666; }
        .invoice-info { flex: 1; text-align: right; }
        .invoice-title { text-align: center; margin: 15px 0; font-size: 18px; font-weight: bold; color: #2c5282; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
        table, th, td { border: 1px solid #ddd; }
        th, td { padding: 6px; text-align: left; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .right { text-align: right; }
        .total { font-weight: bold; background-color: #e6f7ff; }
        .amount-in-words { margin-top: 12px; font-style: italic; font-size: 11px; padding: 8px; background-color: #f9f9f9; border-left: 3px solid #2c5282; }
        .section { margin-top: 15px; }
        .section h3 { margin: 0 0 8px 0; font-size: 13px; color: #2c5282; border-bottom: 1px solid #eee; padding-bottom: 4px; }
        .logo-container { display: flex; align-items: center; margin-bottom: 10px; }
        .logo { width: 60px; height: 60px; background-color: #2c5282; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px; margin-right: 12px; }
        .qr-code { width: 150px; height: 150px; margin-top: 10px; }
        .footer { margin-top: 25px; text-align: center; font-size: 10px; color: #888; border-top: 1px solid #eee; padding-top: 10px; }
        .signature { margin-top: 30px; border-top: 1px dashed #ccc; padding-top: 10px; font-size: 11px; }
        .compact { margin: 5px 0; }
        .text-sm { font-size: 11px; }
        .text-xs { font-size: 10px; }
        .watermark {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 400px; /* adjust size as needed */
  height: 400px;
  opacity: 0.30; /* very light */
  transform: translate(-50%, -50%);
  z-index: 0;
  pointer-events: none; /* so it doesn't block clicks */
}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="company-info">
            <div class="logo-container">
              <div class="logo">RS</div>
              <div>
              <img src="https://res.cloudinary.com/dmedhsl41/image/upload/v1755162647/user_apis/x6hvffl4atdk4fe6tdlq.png" class="watermark" />

                <div class="company-name">RideShare Pro</div>
                <div class="company-details">
                  <div>123 Ride Street, City Center</div>
                  <div>+91 9876543210 • support@rideshare.com</div>
                  <div>GSTIN: 27ABCDE1234F1Z5</div>
                </div>
              </div>
            </div>
          </div>

          <div class="invoice-info">
            <div style="font-weight: bold; font-size: 14px; color: #2c5282;">TAXI INVOICE</div>
            <div class="compact"><strong>Invoice No:</strong> ${this.generateInvoiceNumber(rideIdString)}</div>
            <div class="compact"><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</div>
            <div class="compact"><strong>Time:</strong> ${new Date().toLocaleTimeString('en-IN')}</div>
          </div>
        </div>

        <div class="section">
          <table>
            <tr>
              <th style="width: 50%;">Bill To:</th>
              <th style="width: 50%;">Ride Details:</th>
            </tr>
            <tr>
              <td>
                <strong>${user.name}</strong><br>
                📞 ${user.contactNumber}<br>
                📧 ${user.email || 'N/A'}
              </td>
              <td>
                <strong>Ride ID:</strong> ${shortRideId}<br>
                <strong>Status:</strong> <span style="color: green;">${ride.status.toUpperCase()}</span><br>
              </td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h3>Driver & Vehicle Information</h3>
          <table>
            <tr>
              <th>Driver Name</th>
              <th>Contact</th>
              <th>Vehicle Type</th>
              <th>Vehicle Number</th>
            </tr>
            <tr>
              <td>${driver.name}</td>
              <td>${driver.contactNumber}</td>
              <td>${ride.vehicleType.toUpperCase()}</td>
              <td>${driver.vehicleNumber || 'N/A'}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h3>Ride Route Details</h3>
          <table>
            <tr>
              <th>Pickup Location</th>
              <th>Dropoff Location</th>
              <th>Distance</th>
            </tr>
            <tr>
              <td>${this.formatCoordinates(ride.pickupLocation.coordinates)}</td>
              <td>${this.formatCoordinates(ride.dropoffLocation.coordinates)}</td>
              <td>${ride.distance.toFixed(2)} km</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h3>Fare Breakdown</h3>
          <table>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Rate (₹)</th>
              <th>Amount (₹)</th>
            </tr>
            <tr>
              <td>Distance Charge</td>
              <td>${ride.distance.toFixed(2)} km</td>
              <td class="right">${perKmFare.toFixed(2)}</td>
              <td class="right">${distanceFare.toFixed(2)}</td>
            </tr>
            <tr>
              <td>GST (${gstPercent}%)</td>
              <td>-</td>
              <td class="right">-</td>
              <td class="right">${tax.toFixed(2)}</td>
            </tr>
            <tr class="total">
              <td colspan="3" class="right"><strong>Total Amount:</strong></td>
              <td class="right"><strong>₹${totalFare.toFixed(2)}</strong></td>
            </tr>
          </table>
        </div>

        <div class="amount-in-words">
          <strong>Amount in Words:</strong> ${totalInWords} rupees only
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px;">
          <div class="signature" style="flex: 2;">
            <div>Authorized Signature</div>
            <div class="text-xs">For RideShare Pro</div>
            <div class="text-xs">Date: ${new Date().toLocaleDateString('en-IN')}</div>
          </div>

          <div style="flex: 1; text-align: center;">
            <img src="${qrCodeData}" class="qr-code" alt="Ride QR Code">
            <div class="text-xs">Scan to view ride details</div>
          </div>

          <div class="signature" style="flex: 2; text-align: right;">
            <div>Customer Signature</div>
            <div class="text-xs">I acknowledge receipt of services</div>
            <div class="text-xs">Date: ________________</div>
          </div>
        </div>

        <div class="footer">
          <div>Thank you for choosing RideShare Pro!</div>
          <div>This is a computer-generated invoice • www.rideshare.com</div>
          <div>For queries: support@rideshare.com • +91 9876543210</div>
        </div>
      </div>
    </body>
    </html>
    `;

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfUint8Array = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
    });

    await browser.close();
    return Buffer.from(pdfUint8Array);
  }

  private async generateQRCode(ride: any): Promise<string> {
    try {
      const qrText = `
Ride ID: ${ride._id}
Status: ${ride.status}
Rider: ${ride.bookedBy.name}
Driver: ${ride.driver.name}
Vehicle: ${ride.vehicleType} (${ride.driver.vehicleNumber || 'N/A'})
Distance: ${ride.distance.toFixed(2)} km
Fare: ₹${ride.totalFare.toFixed(2)}
Pickup: ${this.formatCoordinates(ride.pickupLocation.coordinates)}
Dropoff: ${this.formatCoordinates(ride.dropoffLocation.coordinates)}
Date: ${new Date().toLocaleDateString('en-IN')}
Time: ${new Date().toLocaleTimeString('en-IN')}
      `.trim();

      return await QRCode.toDataURL(qrText, {
        width: 250,
        margin: 2,
        color: { dark: '#2c5282', light: '#ffffff' },
      });
    } catch (error) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9...';
    }
  }

  private formatCoordinates(coordinates: number[]): string {
    if (!coordinates || coordinates.length !== 2) return 'Location not available';
    const lat = coordinates[1];
    const lng = coordinates[0];

    if (lat > 28.4 && lat < 28.7 && lng > 77.0 && lng < 77.3) return 'Connaught Place, New Delhi';
    if (lat > 19.0 && lat < 19.2 && lng > 72.8 && lng < 73.0) return 'Bandra, Mumbai';
    if (lat > 12.9 && lat < 13.1 && lng > 77.5 && lng < 77.7) return 'MG Road, Bangalore';

    return `Lat: ${lat.toFixed(4)}, Long: ${lng.toFixed(4)}`;
  }

  private generateInvoiceNumber(rideId: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const shortId = rideId;
    return `INV-${year}${month}${day}-${shortId}`;
  }
}
