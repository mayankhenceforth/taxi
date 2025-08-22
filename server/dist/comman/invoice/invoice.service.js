"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const config_1 = require("@nestjs/config");
const puppeteer = require("puppeteer");
const number_to_words_1 = require("number-to-words");
const QRCode = require("qrcode");
const ride_schema_1 = require("../schema/ride.schema");
const user_schema_1 = require("../schema/user.schema");
const axios_1 = require("axios");
let InvoiceService = class InvoiceService {
    rideModel;
    userModel;
    configService;
    constructor(rideModel, userModel, configService) {
        this.rideModel = rideModel;
        this.userModel = userModel;
        this.configService = configService;
    }
    dropLocationName;
    pickupLocationName;
    async generateInvoice(rideId) {
        const objectId = new mongoose_2.Types.ObjectId(rideId);
        const ride = await this.rideModel
            .findById(objectId)
            .populate('bookedBy')
            .populate({
            path: 'driver',
            populate: { path: 'vehicleDetails', model: 'VehicleDetails' }
        })
            .exec();
        if (!ride)
            throw new Error('Ride not found');
        const user = ride.bookedBy;
        const driver = ride.driver;
        let perKmFare;
        let gstPercent;
        switch ((ride.vehicleType || '').toLowerCase()) {
            case 'bike':
                perKmFare = Number(this.configService.get('RIDE_BIKE_FARE')) || 10;
                gstPercent = Number(this.configService.get('RIDE_BIKE_GST')) || 5;
                break;
            case 'car':
                perKmFare = Number(this.configService.get('RIDE_CAR_FARE')) || 20;
                gstPercent = Number(this.configService.get('RIDE_CAR_GST')) || 12;
                break;
            default:
                perKmFare = Number(this.configService.get('RIDE_FARE')) || 15;
                gstPercent = Number(this.configService.get('RIDE_FARE_GST')) || 10;
                break;
        }
        const distanceFare = (ride.distance || 0) * perKmFare;
        const tax = distanceFare * (gstPercent / 100);
        const totalFare = distanceFare + tax;
        const totalInWords = (0, number_to_words_1.toWords)(Math.round(totalFare));
        const pickupRes = await axios_1.default.get(`https://api.geoapify.com/v1/geocode/reverse?lat=${ride.pickupLocation.coordinates[0]}&lon=${ride.pickupLocation.coordinates[1]}&apiKey=${this.configService.get('GEOAPIFY_API_KEY')}`);
        const pickupLocationName = pickupRes.data.features[0]?.properties?.formatted || 'N/A';
        const dropRes = await axios_1.default.get(`https://api.geoapify.com/v1/geocode/reverse?lat=${ride.dropoffLocation.coordinates[0]}&lon=${ride.dropoffLocation.coordinates[1]}&apiKey=${this.configService.get('GEOAPIFY_API_KEY')}`);
        const dropLocationName = dropRes.data.features[0]?.properties?.formatted || 'N/A';
        const imageUrl = "https://res.cloudinary.com/dmedhsl41/image/upload/v1755751596/360_F_471467270_wdaTtaF6QWhqILrY0LGUZvpIXOtVEgGP-removebg-preview_g3rsyw.png";
        const qrCodeData = await this.generateQRCode({ ...ride.toObject(), totalFare });
        const rideIdString = rideId;
        const refundSection = ride.paymentStatus === 'refunded' || ride.refundStatus === 'processed'
            ? `
    <div class="section">
      <h3>Refund Details</h3>
      <table>
        <tr>
          <th>Refund Amount</th>
          <th>Refund Percentage</th>
          <th>Refund Reason</th>
        </tr>
        <tr>
          <td>₹${(ride.refundAmount || 0).toFixed(2)}</td>
          <td>${ride.refundPercentage || 0}%</td>
          <td>${ride.refundReason || '-'}</td>
        </tr>
      </table>
    </div>
    ` : '';
        const html = `
    <html>
    <head>
      <style>
        body { font-family: 'Helvetica', Arial, sans-serif; margin: 15px; font-size: 12px; color: #333; text-transform: uppercase; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #fcad02dc; padding-bottom: 15px; }
        .company-info { flex: 2; }
        .company-name { font-size: 20px; font-weight: bold; color: #fcad02dc; margin-bottom: 5px; }
        .company-details { font-size: 11px; color: #666; }
        .invoice-info { flex: 1; text-align: right; }
        .invoice-title { text-align: center; margin: 15px 0; font-size: 18px; font-weight: bold; color: #fcad02dc; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
        table, th, td { border: 1px solid #ddd; }
        th, td { padding: 6px; text-align: left; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .right { text-align: right; }
        .total { font-weight: bold; background-color: #e6f7ff; }
        .amount-in-words { margin-top: 12px; font-style: italic; font-size: 11px; padding: 8px; background-color: #f9f9f9; border-left: 3px solid #fcad02dc; }
        .section { margin-top: 15px; }
        .section h3 { margin: 0 0 8px 0; font-size: 13px; color: #fcad02dc; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
        .logo-container { display: flex; align-items: center; margin-bottom: 10px; }
        .logo { width: 60px; height: 60px; background-color: #fcad02dc; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px; margin-right: 12px; }
        .qr-code { width: 150px; height: 150px; margin-top: 10px; }
        .footer { margin-top: 25px; text-align: center; font-size: 10px; color: #888; border-top: 1px solid #ddd; padding-top: 10px; }
        .signature { margin-top: 30px; border-top: 1px dashed #ddd; padding-top: 10px; font-size: 11px; }
        .compact { margin: 5px 0; }
        .text-xs { font-size: 10px; }
        .watermark { position: fixed; top: 50%; left: 50%; width: 350px; height: 350px; opacity: 0.20; transform: translate(-50%, -50%); z-index: 0; pointer-events: none; }
        .logoImage { width: 100%; height: 100%; object-fit: cover; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="company-info">
            <div class="logo-container">
              <div class="logo"><img src="${imageUrl}" class='logoImage' /></div>
              <img src="${imageUrl}" class="watermark" />
              <div class="company-name">RideShare Pro</div>
              <div class="company-details">
                <div>123 Ride Street, City Center</div>
                <div>+91 9876543210 • support@rideshare.com</div>
                <div>GSTIN: 27ABCDE1234F1Z5</div>
              </div>
            </div>
          </div>
          <div class="invoice-info">
            <div style="font-weight: bold; font-size: 16px;">TAXI INVOICE</div>
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
                <strong>Ride ID:</strong> ${rideIdString}<br>
                <strong>Status:</strong> <span style="color: green;">${ride.status.toUpperCase()}</span><br>
                <strong>Vehicle Type:</strong> ${ride.vehicleType.toUpperCase()}
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
              <th>Vehicle Model</th>
              <th>Vehicle Number</th>
            </tr>
            <tr>
              <td>${driver.name}</td>
              <td>${driver.contactNumber}</td>
              <td>${driver.vehicleDetails?.type.toUpperCase() || 'N/A'}</td>
              <td>${driver.vehicleDetails?.model || 'N/A'}</td>
              <td>${driver.vehicleDetails?.numberPlate || 'N/A'}</td>
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
              <td>${pickupLocationName}</td>
              <td>${dropLocationName}</td>
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

        ${refundSection}

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
    async TotalIncome(filter) {
        const primaryColor = "#f4c311dc";
        const watermarkOpacity = "0.15";
        let filterDate = null;
        const now = new Date();
        switch (filter) {
            case '1h':
                filterDate = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case '1d':
                filterDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '1w':
                filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '1m':
                filterDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            default: filterDate = null;
        }
        const query = { paymentStatus: 'paid' };
        if (filterDate)
            query.createdAt = { $gte: filterDate };
        const rides = await this.rideModel
            .find(query)
            .populate('bookedBy', 'name email')
            .populate('driver', 'name')
            .exec();
        const totalIncome = rides.reduce((sum, ride) => sum + (ride.TotalFare || 0), 0);
        const totalInWords = (0, number_to_words_1.toWords)(Math.round(totalIncome));
        const totalRides = rides.length;
        const totalDrivers = new Set(rides.map(r => r.driver?._id.toString())).size;
        const totalCustomers = new Set(rides.map(r => r.bookedBy?._id.toString())).size;
        const repeatCustomers = Array.from(rides.reduce((map, ride) => {
            const id = ride.bookedBy?._id.toString();
            if (!id)
                return map;
            map.set(id, (map.get(id) || 0) + 1);
            return map;
        }, new Map())).filter(([_, count]) => count > 1).length;
        const qrData = await QRCode.toDataURL(`Total Amount: ₹${totalIncome.toFixed(2)}
Total Rides: ${totalRides}
Total Drivers: ${totalDrivers}
Total Customers: ${totalCustomers}
Repeat Customers: ${repeatCustomers}
Generated: ${new Date().toLocaleString('en-IN')}`);
        const imageUrl = "https://res.cloudinary.com/dmedhsl41/image/upload/v1755751596/360_F_471467270_wdaTtaF6QWhqILrY0LGUZvpIXOtVEgGP-removebg-preview_g3rsyw.png";
        const invoiceNo = `INC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${filter || 'ALL'}`;
        const rows = rides.map((ride, index) => {
            const pickup = ride.pickupLocation?.coordinates || [];
            const drop = ride.dropoffLocation?.coordinates || [];
            const pickupCoords = pickup.length === 2 ? `${pickup[1]}, ${pickup[0]}` : 'N/A';
            const dropCoords = drop.length === 2 ? `${drop[1]}, ${drop[0]}` : 'N/A';
            return `
      <tr>
        <td>${index + 1}</td>
        <td>${ride._id}</td>
        <td>${ride.vehicleType || 'N/A'}</td>
        <td>${ride.distance?.toFixed(2) || 0} km</td>
        <td>₹${ride.TotalFare?.toFixed(2) || 0}</td>
        <td>${ride.bookedBy?.name || 'N/A'}</td>
        <td>${ride.driver?.name || 'N/A'}</td>
        <td>${pickupCoords}</td>
        <td>${dropCoords}</td>
        <td>${new Date(ride.createdAt).toLocaleDateString('en-IN')}</td>
      </tr>
    `;
        }).join('');
        const html = `
    <html>
    <head>
      <style>
        body { font-family: 'Helvetica', Arial, sans-serif; margin: 15px; font-size: 12px; color: #333; text-transform: uppercase; }
        .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid ${primaryColor}; padding-bottom: 15px; }
        .company-info { flex: 2; }
        .company-name { font-size: 20px; font-weight: bold; color: ${primaryColor}; margin-bottom: 5px; }
        .company-details { font-size: 11px; color: #666; }
        .invoice-info { flex: 1; text-align: right; }
        .logo-container { display: flex; align-items: center; margin-bottom: 10px; }
        .logo { width: 60px; height: 60px; background-color: ${primaryColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px; }
        .qr-code { width: 120px; height: 120px; margin-top: 10px;  }
        .watermark { position: fixed; top: 50%; left: 50%; width: 350px; height: 350px; opacity: ${watermarkOpacity}; transform: translate(-50%, -50%); z-index: 0; pointer-events: none; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
        table, th, td { border: 1px solid #ddd; }
        th, td { padding: 6px; text-align: center; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .total { font-weight: bold; background-color: #e6f7ff; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="company-info">
            <div class="logo-container">
              <div class="logo"><img src="${imageUrl}" style="width:100%; height:100%;" /></div>
              <img src="${imageUrl}" class="watermark" />
              <div>
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
            <div style="font-weight: bold; font-size: 16px;">TOTAL INCOME REPORT</div>
            <div><strong>Invoice No:</strong> ${invoiceNo}</div>
            <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</div>
            <div><strong>Time:</strong> ${new Date().toLocaleTimeString('en-IN')}</div>
          </div>
        </div>

        <table>
          <tr>
            <th>#</th>
            <th>Ride ID</th>
            <th>Vehicle</th>
            <th>Distance</th>
            <th>Fare (₹)</th>
            <th>Customer</th>
            <th>Driver</th>
            <th>Pickup (Lat, Lon)</th>
            <th>Drop (Lat, Lon)</th>
            <th>Date</th>
          </tr>
          ${rows || `<tr><td colspan="10">No Paid Rides Found</td></tr>`}
          <tr class="total">
            <td colspan="9">TOTAL INCOME</td>
            <td><strong>₹${totalIncome.toFixed(2)}</strong></td>
          </tr>
        </table>

        <div style="margin-top:12px; font-style:italic;">
          <strong>Amount in Words:</strong> ${totalInWords} rupees only
        </div>

        <div style="margin-top:20px; text-align:center ; ">
          <img src="${qrData}" class="qr-code" />
          <div style="font-size:10px;">Scan for report verification</div>
        </div>
      </div>
    </body>
    </html>
  `;
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
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
    async NewUsersReport(filter) {
        const primaryColor = "#f4c311dc";
        const watermarkOpacity = "0.15";
        let filterDate = null;
        const now = new Date();
        switch (filter) {
            case '1h':
                filterDate = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case '1d':
                filterDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '1w':
                filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '1m':
                filterDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            default: filterDate = null;
        }
        const query = {};
        if (filterDate)
            query.createdAt = { $gte: filterDate };
        const users = await this.userModel.find(query).exec();
        const totalUsers = users.length;
        const repeatUsers = Array.from(users.reduce((map, user) => {
            if (!user.contactNumber)
                return map;
            const contactNumber = String(user.contactNumber);
            map.set(contactNumber, (map.get(contactNumber) || 0) + 1);
            return map;
        }, new Map())).filter(([_, count]) => count > 1).length;
        const roleCounts = users.reduce((acc, user) => {
            const role = (user.role || "unknown").toLowerCase();
            acc[role] = (acc[role] || 0) + 1;
            return acc;
        }, {});
        const qrData = await QRCode.toDataURL(`Total Users: ${totalUsers}
Repeat Users: ${repeatUsers}
Roles:
- Users: ${roleCounts["user"] || 0}
- Drivers: ${roleCounts["driver"] || 0}
- Admins: ${roleCounts["admin"] || 0}
Generated: ${new Date().toLocaleString('en-IN')}`);
        const imageUrl = "https://res.cloudinary.com/dmedhsl41/image/upload/v1755751596/360_F_471467270_wdaTtaF6QWhqILrY0LGUZvpIXOtVEgGP-removebg-preview_g3rsyw.png";
        const invoiceNo = `USR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${filter || 'ALL'}`;
        const rows = users.map((user, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${user._id}</td>
        <td>${user.name || 'N/A'}</td>
        <td>${user.contactNumber || 'N/A'}</td>
        <td>${user.role || 'N/A'}</td>
        <td>${new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
        <td>${new Date(user.createdAt).toLocaleTimeString('en-IN')}</td>
      </tr>
    `).join('');
        const html = `
    <html>
    <head>
      <style>
        body { font-family: 'Helvetica', Arial , sans-serif; margin: 15px; font-size: 12px; color: #333; text-transform: capitalize; }
        .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid ${primaryColor}; padding-bottom: 15px; }
        .company-info { flex: 2; }
        .company-name { font-size: 20px; font-weight: bold; color: ${primaryColor}; margin-bottom: 5px; }
        .company-details { font-size: 11px; color: #666; }
        .invoice-info { flex: 1; text-align: right; }
        .logo-container { display: flex; align-items: center; margin-bottom: 10px; }
        .logo { width: 60px; height: 60px; background-color: ${primaryColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px; }
        .qr-code { width: 180px; height: 180px; margin-top: 10px; }
        .watermark { position: fixed; top: 50%; left: 50%; width: 350px; height: 350px; opacity: ${watermarkOpacity}; transform: translate(-50%, -50%); z-index: 0; pointer-events: none; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
        table, th, td { border: 1px solid #ddd; }
        th, td { padding: 6px; text-align: center; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .total { font-weight: bold; background-color: #e6f7ff; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="company-info">
            <div class="logo-container">
              <div class="logo"><img src="${imageUrl}" style="width:100%; height:100%;" /></div>
              <img src="${imageUrl}" class="watermark" />
              <div>
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
            <div style="font-weight: bold; font-size: 16px;">NEW USERS REPORT</div>
            <div><strong>Report No:</strong> ${invoiceNo}</div>
            <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</div>
            <div><strong>Time:</strong> ${new Date().toLocaleTimeString('en-IN')}</div>
          </div>
        </div>

        <table>
          <tr>
            <th>#</th>
            <th>User ID</th>
            <th>Name</th>
            <th>Contact Number</th>
            <th>Role</th>
            <th>Date</th>
            <th>Time</th>
          </tr>
          ${rows || `<tr><td colspan="7">No Users Found</td></tr>`}
          <tr class="total">
            <td colspan="6">TOTAL USERS</td>
            <td>${totalUsers}</td>
          </tr>
          <tr class="total">
            <td colspan="6">REPEAT USERS</td>
            <td>${repeatUsers}</td>
          </tr>
          <tr class="total">
            <td colspan="6">USERS</td>
            <td>${roleCounts["user"] || 0}</td>
          </tr>
          <tr class="total">
            <td colspan="6">DRIVERS</td>
            <td>${roleCounts["driver"] || 0}</td>
          </tr>
          <tr class="total">
            <td colspan="6">ADMINS</td>
            <td>${roleCounts["admin"] || 0}</td>
          </tr>
        </table>

        <div style="margin-top:20px; text-align:center;">
          <img src="${qrData}" class="qr-code" />
          <div style="font-size:10px;">Scan for report verification</div>
        </div>
      </div>
    </body>
    </html>
  `;
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
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
    async NewRidesReport(filter) {
        const primaryColor = "#f4c311dc";
        const watermarkOpacity = "0.15";
        let filterDate = null;
        const now = new Date();
        switch (filter) {
            case '1h':
                filterDate = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case '1d':
                filterDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '1w':
                filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '1m':
                filterDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            default: filterDate = null;
        }
        const query = {};
        if (filterDate)
            query.createdAt = { $gte: filterDate };
        const rides = await this.rideModel.find(query)
            .populate("bookedBy", "name contactNumber role")
            .populate("driver", "name contactNumber role")
            .exec();
        const totalRides = rides.length;
        const totalEarnings = rides.reduce((acc, ride) => acc + (ride.TotalFare || 0), 0);
        const statusCounts = rides.reduce((acc, ride) => {
            const status = (ride.status || "unknown").toLowerCase();
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        const qrData = await QRCode.toDataURL(`Total Rides: ${totalRides}
Completed: ${statusCounts["completed"] || 0}
Cancelled: ${statusCounts["cancelled"] || 0}
Pending: ${statusCounts["pending"] || 0}
Started: ${statusCounts["started"] || 0}
TotalEarnings: ${totalEarnings} ₹
Generated: ${new Date().toLocaleString('en-IN')}`);
        const imageUrl = "https://res.cloudinary.com/dmedhsl41/image/upload/v1755751596/360_F_471467270_wdaTtaF6QWhqILrY0LGUZvpIXOtVEgGP-removebg-preview_g3rsyw.png";
        const invoiceNo = `RID-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${filter || 'ALL'}`;
        const rows = rides.map((ride, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${ride._id}</td>
      <td>${ride.bookedBy?.name || 'N/A'} (${ride.bookedBy?.contactNumber || 'N/A'}) [${ride.bookedBy?.role || 'User'}]</td>
      <td>${ride.driver?.name || 'N/A'} (${ride.driver?.contactNumber || 'N/A'}) [${ride.driver?.role || 'Driver'}]</td>
      <td>${ride.pickupLocation?.coordinates ? `${ride.pickupLocation.coordinates[1]}, ${ride.pickupLocation.coordinates[0]}` : 'N/A'}</td>
      <td>${ride.dropoffLocation?.coordinates ? `${ride.dropoffLocation.coordinates[1]}, ${ride.dropoffLocation.coordinates[0]}` : 'N/A'}</td>
      <td>${ride.TotalFare || '0'} ₹</td>
      <td>${ride.status || 'N/A'}</td>
      <td>${new Date(ride.createdAt).toLocaleDateString('en-IN')}</td>
      <td>${new Date(ride.createdAt).toLocaleTimeString('en-IN')}</td>
    </tr>
  `).join('');
        const html = `
    <html>
    <head>
      <style>
        body { font-family: 'Helvetica', Arial, sans-serif; margin: 15px; font-size: 12px; color: #333; text-transform: uppercase; }
        .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid ${primaryColor}; padding-bottom: 15px; }
        .company-info { flex: 2; }
        .company-name { font-size: 20px; font-weight: bold; color: ${primaryColor}; margin-bottom: 5px; }
        .company-details { font-size: 11px; color: #666; }
        .invoice-info { flex: 1; text-align: right; }
        .logo-container { display: flex; align-items: center; margin-bottom: 10px; }
        .logo { width: 60px; height: 60px; background-color: ${primaryColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px; }
        .qr-code { width: 180px; height: 180px; margin-top: 10px; }
        .watermark { position: fixed; top: 50%; left: 50%; width: 350px; height: 350px; opacity: ${watermarkOpacity}; transform: translate(-50%, -50%); z-index: 0; pointer-events: none; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10px; }
        table, th, td { border: 1px solid #ddd; }
        th, td { padding: 5px; text-align: center; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .total { font-weight: bold; background-color: #e6f7ff; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="company-info">
            <div class="logo-container">
              <div class="logo"><img src="${imageUrl}" style="width:100%; height:100%;" /></div>
              <img src="${imageUrl}" class="watermark" />
              <div>
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
            <div style="font-weight: bold; font-size: 16px;">NEW RIDES REPORT</div>
            <div><strong>Report No:</strong> ${invoiceNo}</div>
            <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</div>
            <div><strong>Time:</strong> ${new Date().toLocaleTimeString('en-IN')}</div>
          </div>
        </div>

        <table>
          <tr>
            <th>#</th>
            <th>Ride ID</th>
            <th>User</th>
            <th>Driver</th>
            <th>Pickup</th>
            <th>Drop</th>
            <th>Fare</th>
            <th>Status</th>
            <th>Date</th>
            <th>Time</th>
          </tr>
          ${rows || `<tr><td colspan="10">No Rides Found</td></tr>`}
          <tr class="total"><td colspan="9">TOTAL RIDES</td><td>${totalRides}</td></tr>
          <tr class="total"><td colspan="9">COMPLETED</td><td>${statusCounts["completed"] || 0}</td></tr>
          <tr class="total"><td colspan="9">CANCELLED</td><td>${statusCounts["cancelled"] || 0}</td></tr>
          <tr class="total"><td colspan="9">PENDING</td><td>${statusCounts["pending"] || 0}</td></tr>
          <tr class="total"><td colspan="9">STARTED</td><td>${statusCounts["started"] || 0}</td></tr>
          <tr class="total"><td colspan="9">TOTAL EARNINGS</td><td>${totalEarnings} ₹</td></tr>
        </table>

        <div style="margin-top:20px; text-align:center;">
          <img src="${qrData}" class="qr-code" />
          <div style="font-size:10px;">Scan for report verification</div>
        </div>
      </div>
    </body>
    </html>
  `;
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
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
    async generateQRCode(ride) {
        const qrText = `
Ride ID: ${ride._id}
Status: ${ride.status}
Rider: ${ride.bookedBy.name}
Driver: ${ride.driver.name}
Vehicle: ${ride.vehicleType.toUpperCase()} (${ride.driver.vehicleDetails?.numberPlate || 'N/A'})
Distance: ${ride.distance.toFixed(2)} km
Fare: ₹${ride.totalFare.toFixed(2)}
Pickup: ${this.pickupLocationName}
Dropoff: ${this.dropLocationName}
Date: ${new Date().toLocaleDateString('en-IN')}
Time: ${new Date().toLocaleTimeString('en-IN')}
    `.trim();
        return await QRCode.toDataURL(qrText, {
            width: 250,
            margin: 2,
            color: { dark: '#e7a20cff', light: '#ffffff' },
        });
    }
    generateInvoiceNumber(rideId) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `INV-${year}${month}${day}-${rideId}`;
    }
};
exports.InvoiceService = InvoiceService;
exports.InvoiceService = InvoiceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(ride_schema_1.Ride.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        config_1.ConfigService])
], InvoiceService);
//# sourceMappingURL=invoice.service.js.map