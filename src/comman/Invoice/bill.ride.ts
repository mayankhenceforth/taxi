import puppeteer from 'puppeteer';
import * as fs from 'fs';
import path from 'path';

export class RideInvoiceService {
    private routeImagePath: string = '/home/hf/Desktop/texi booking /src/logo.jpeg';

    async generateInvoice(): Promise<Buffer> {
        const rideData = {
            rideId: 'RIDE12345',
            bookedBy: 'John Doe',
            driver: 'Jane Smith',
            vehicleType: 'Car',
            pickupLocation: 'New York, NY',
            dropoffLocation: 'Brooklyn, NY',
            distanceKm: 12.5,
            fare: 25,
            gst: 2.5,
            tripCharge: 3,
            airportCharge: 5,
            totalAmount: 35.5,
            routeImageUrl: this.routeImagePath,
        };

        const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 8px; border: 1px solid #ccc; text-align: left; }
          img { display: block; margin: 20px auto; max-width: 100%; }
        </style>
      </head>
      <body>
 <div>
 <img src="src/logo.jpeg" alt="Logo" style="width: 100px; height: auto; display: block; margin: 0 auto;">
 <h1>Ride Invoice</h1></div>
        <p><strong>Ride ID:</strong> ${rideData.rideId}</p>
        <p><strong>Passenger:</strong> ${rideData.bookedBy}</p>
        <p><strong>Driver:</strong> ${rideData.driver}</p>
        <p><strong>Vehicle Type:</strong> ${rideData.vehicleType}</p>
        <p><strong>Pickup:</strong> ${rideData.pickupLocation}</p>
        <p><strong>Dropoff:</strong> ${rideData.dropoffLocation}</p>
        <table>
          <tr><th>Fare</th><td>$${rideData.fare.toFixed(2)}</td></tr>
          <tr><th>GST</th><td>$${rideData.gst.toFixed(2)}</td></tr>
          <tr><th>Trip Charge</th><td>$${rideData.tripCharge.toFixed(2)}</td></tr>
          <tr><th>Airport Pickup Charge</th><td>$${rideData.airportCharge.toFixed(2)}</td></tr>
          <tr><th>Total Amount</th><td>$${rideData.totalAmount.toFixed(2)}</td></tr>
        </table>
        <img src="file://${rideData.routeImageUrl}" alt="Ride Route">
      </body>
    </html>
  `;

        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfUint8 = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();

        return Buffer.from(pdfUint8); // convert to Buffer
    }

}

// Example usage
// (async () => {
//     const invoiceService = new RideInvoiceService();
//     const pdfBuffer = await invoiceService.generateInvoice();
//     fs.writeFileSync('ride_invoice.pdf', pdfBuffer);
//     console.log('Invoice PDF generated successfully!');
// })();
