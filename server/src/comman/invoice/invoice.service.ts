import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { toWords } from 'number-to-words';
import * as QRCode from 'qrcode';
import { Ride, RideDocument } from '../schema/ride.schema';
import { User, UserDocument } from '../schema/user.schema';
import { HtmlTemplateService } from './html-template.service';
import { PdfGeneratorService } from './pdf.service';
import { GeocodingService } from './geocoding.service';
import { QRCodeData, ReportData, InvoiceData } from './invoice.types';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel(Ride.name) private rideModel: Model<RideDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
    private readonly htmlTemplateService: HtmlTemplateService,
    private readonly pdfGeneratorService: PdfGeneratorService,
    private readonly geocodingService: GeocodingService,
  ) { }

  // Reusable helper methods
  private async safePopulateRide(rideId: string) {
    const objectId = new Types.ObjectId(rideId);

    let ride = await this.rideModel
      .findById(objectId)
      .populate('bookedBy', 'name email contactNumber')
      .populate({
        path: 'driver',
        select: 'name contactNumber',
        populate: {
          path: 'vehicleDetails',
          model: 'VehicleDetails',
          select: 'type model numberPlate',
        },
      }).populate('paymentId')
      .exec();

    if (!ride) throw new Error('Ride not found');

    // Fallback if population didn't work
    if (!ride.bookedBy || typeof ride.bookedBy === 'string') {
      const user = await this.userModel
        .findById(ride.bookedBy)
        .select('name email contactNumber')
        .exec();
      ride.bookedBy = user as any;
    }

    if (!ride.driver || typeof ride.driver === 'string') {
      const driver = await this.userModel
        .findById(ride.driver)
        .populate('vehicleDetails', 'type model numberPlate')
        .select('name contactNumber')
        .exec();
      ride.driver = driver as any;
    }

    return ride;
  }

  private extractUserDriverInfo(ride: any) {
    const user = ride.bookedBy as any;
    const driver = ride.driver as any;

    if (!user) throw new Error('User not found');
    if (!driver) throw new Error('Driver not found');

    return {
      userName: user?.name || 'N/A',
      userContact: user?.contactNumber || 'N/A',
      userEmail: user?.email || 'N/A',
      driverName: driver?.name || 'N/A',
      driverContact: driver?.contactNumber || 'N/A',
      vehicleType: (driver?.vehicleDetails?.type || 'N/A').toUpperCase(),
      vehicleModel: driver?.vehicleDetails?.model || 'N/A',
      vehicleNumber: driver?.vehicleDetails?.numberPlate || 'N/A',
    };
  }

  private async generateQRCode(data: QRCodeData): Promise<string> {
    const {
      rideId = 'N/A',
      totalFare = 0,
      status = 'N/A',
      paymentStatus = 'N/A',
      refundStatus = 'N/A',
      refundAmount = 0,
      userName = 'N/A',
      driverName = 'N/A',
      vehicleType = 'N/A',
      vehicleNumber = 'N/A',
      distance = 0,
      pickupLocation = 'N/A',
      dropoffLocation = 'N/A',
      baseFare = 0,
      gstAmount = 0,
      platformFee = 0,
      surgeCharge = 0,
      nightCharge = 0,
      tollFee = 0,
      parkingFee = 0,
      waitingCharge = 0,
      bonusAmount = 0,
      referralDiscount = 0,
      promoDiscount = 0,
      driverEarnings = 0,
      platformEarnings = 0,
      userContact = 'N/A',
      userEmail = 'N/A',
      driverContact = 'N/A',
      vehicleModel = 'N/A',
      refundPercentage = 0,
      refundReason = 'N/A',
    } = data;

    // Enhanced QR code content with all ride information
    const qrText = `
RIDESHARE PRO - RIDE RECEIPT
================================
RIDE INFORMATION:
• Ride ID: ${rideId}
• Status: ${status.toUpperCase()}
• Payment Status: ${paymentStatus.toUpperCase()}
• Date: ${new Date().toLocaleDateString('en-IN')}
• Time: ${new Date().toLocaleTimeString('en-IN')}

USER DETAILS:
• Name: ${userName}
• Contact: ${userContact}
• Email: ${userEmail}

DRIVER & VEHICLE DETAILS:
• Driver Name: ${driverName}
• Driver Contact: ${driverContact}
• Vehicle Type: ${vehicleType}
• Vehicle Model: ${vehicleModel}
• Vehicle Number: ${vehicleNumber}

ROUTE INFORMATION:
• Pickup: ${pickupLocation}
• Dropoff: ${dropoffLocation}
• Distance: ${distance.toFixed(2)} km

FARE BREAKDOWN:
• Base Fare: ₹${baseFare.toFixed(2)}
• GST: ₹${gstAmount.toFixed(2)}
• Platform Fee: ₹${platformFee.toFixed(2)}
${surgeCharge > 0 ? `• Surge Charge: ₹${surgeCharge.toFixed(2)}` : ''}
${nightCharge > 0 ? `• Night Charge: ₹${nightCharge.toFixed(2)}` : ''}
${tollFee > 0 ? `• Toll Fee: ₹${tollFee.toFixed(2)}` : ''}
${parkingFee > 0 ? `• Parking Fee: ₹${parkingFee.toFixed(2)}` : ''}
${waitingCharge > 0 ? `• Waiting Charge: ₹${waitingCharge.toFixed(2)}` : ''}
${bonusAmount > 0 ? `• Bonus: ₹${bonusAmount.toFixed(2)}` : ''}
${referralDiscount > 0 ? `• Referral Discount: -₹${referralDiscount.toFixed(2)}` : ''}
${promoDiscount > 0 ? `• Promo Discount: -₹${promoDiscount.toFixed(2)}` : ''}

TOTAL AMOUNT: ₹${totalFare.toFixed(2)}

EARNINGS DISTRIBUTION:
• Driver Earnings: ₹${driverEarnings.toFixed(2)}
• Platform Earnings: ₹${platformEarnings.toFixed(2)}

${refundStatus !== 'none' && refundStatus ? `
REFUND DETAILS:
• Refund Status: ${refundStatus.toUpperCase()}
• Refund Amount: ₹${refundAmount.toFixed(2)}
• Refund Percentage: ${refundPercentage}%
• Reason: ${refundReason}
` : ''}

================================
Generated by RideShare Pro System
    `.trim();

    return await QRCode.toDataURL(qrText, {
      width: 500,
      margin: 2,
    });
  }

  private generateInvoiceNumber(rideId: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `INV-${year}${month}${day}-${rideId}`;
  }

  private generateReportNumber(prefix: string, filter: string): string {
    const now = new Date();
    return `${prefix}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${filter || 'ALL'}`;
  }

  async generateInvoice(rideId: string): Promise<Buffer> {
    try {
      if (!rideId) throw new BadRequestException('Ride ID is required');

      const ride = await this.safePopulateRide(rideId);
      const userDriverInfo = this.extractUserDriverInfo(ride);

      const [pickupLocationName, dropLocationName] = await Promise.all([
        this.geocodingService.reverseGeocode(
          ride.pickupLocation.coordinates[0],
          ride.pickupLocation.coordinates[1],
        ),
        this.geocodingService.reverseGeocode(
          ride.dropoffLocation.coordinates[0],
          ride.dropoffLocation.coordinates[1],
        ),
      ]);

      const payment = ride.paymentId as any;

      const qrCodeData = await this.generateQRCode({
        rideId: (ride._id as Types.ObjectId).toString(),
        totalFare: ride.TotalFare,
        status: ride.status,
        paymentStatus: ride.paymentStatus,
        refundStatus: payment?.refundStatus || 'none',
        refundAmount: payment?.refundAmount || 0,
        refundPercentage: payment?.refundPercentage || 0,
        refundReason: payment?.refundReason || 'N/A',
        userName: userDriverInfo.userName,
        userContact: userDriverInfo.userContact,
        userEmail: userDriverInfo.userEmail,
        driverName: userDriverInfo.driverName,
        driverContact: userDriverInfo.driverContact,
        vehicleType: userDriverInfo.vehicleType,
        vehicleModel: userDriverInfo.vehicleModel,
        vehicleNumber: userDriverInfo.vehicleNumber,
        distance: ride.distance,
        pickupLocation: pickupLocationName,
        dropoffLocation: dropLocationName,
        baseFare: ride.fareBreakdown.baseFare,
        gstAmount: ride.fareBreakdown.gstAmount,
        platformFee: ride.fareBreakdown.platformFee,
        surgeCharge: ride.fareBreakdown.surgeCharge,
        nightCharge: ride.fareBreakdown.nightCharge,
        tollFee: ride.fareBreakdown.tollFee,
        parkingFee: ride.fareBreakdown.parkingFee,
        waitingCharge: ride.fareBreakdown.waitingCharge,
        bonusAmount: ride.fareBreakdown.bonusAmount,
        referralDiscount: ride.fareBreakdown.referralDiscount,
        promoDiscount: ride.fareBreakdown.promoDiscount,
        driverEarnings: ride.driverEarnings,
        platformEarnings: ride.platformEarnings,
      });

      const totalInWords = toWords(Math.round(ride.TotalFare));
      const invoiceNo = this.generateInvoiceNumber(rideId);

      const html = this.generateInvoiceHtml({
        ride,
        user: userDriverInfo,
        driver: userDriverInfo,
        pickupLocationName,
        dropLocationName,
        qrCodeData,
        totalInWords,
        invoiceNo,
      });

      return await this.pdfGeneratorService.generatePdfFromHtml(html);
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw new Error(`Failed to generate invoice: ${error.message}`);
    }
  }

  private generateInvoiceHtml(data: any): string {
    const {
      ride,
      user,
      driver,
      pickupLocationName,
      dropLocationName,
      qrCodeData,
      totalInWords,
      invoiceNo,
    } = data;

    // Additional charges section
    const additionalChargesSection =
      ride.fareBreakdown.surgeCharge > 0 ||
        ride.fareBreakdown.nightCharge > 0 ||
        ride.fareBreakdown.tollFee > 0 ||
        ride.fareBreakdown.parkingFee > 0 ||
        ride.fareBreakdown.waitingCharge > 0 ||
        ride.fareBreakdown.bonusAmount > 0
        ? `
      <div class="section">
        <h3>Additional Charges & Adjustments</h3>
        <table>
          <tr>
            <th>Description</th>
            <th>Amount (₹)</th>
          </tr>
          ${ride.fareBreakdown.surgeCharge > 0 ? `<tr><td>Surge Charge (${ride.surgeMultiplier || 1}x)</td><td class="right">${ride.fareBreakdown.surgeCharge.toFixed(2)}</td></tr>` : ''}
          ${ride.fareBreakdown.nightCharge > 0 ? `<tr><td>Night Charge</td><td class="right">${ride.fareBreakdown.nightCharge.toFixed(2)}</td></tr>` : ''}
          ${ride.fareBreakdown.tollFee > 0 ? `<tr><td>Toll Fee</td><td class="right">${ride.fareBreakdown.tollFee.toFixed(2)}</td></tr>` : ''}
          ${ride.fareBreakdown.parkingFee > 0 ? `<tr><td>Parking Fee</td><td class="right">${ride.fareBreakdown.parkingFee.toFixed(2)}</td></tr>` : ''}
          ${ride.fareBreakdown.waitingCharge > 0 ? `<tr><td>Waiting Charge</td><td class="right">${ride.fareBreakdown.waitingCharge.toFixed(2)}</td></tr>` : ''}
          ${ride.fareBreakdown.bonusAmount > 0 ? `<tr><td>Bonus Amount</td><td class="right">${ride.fareBreakdown.bonusAmount.toFixed(2)}</td></tr>` : ''}
        </table>
      </div>
      `
        : '';

    // Discounts section
    const discountsSection =
      ride.fareBreakdown.referralDiscount > 0 || ride.fareBreakdown.promoDiscount > 0
        ? `
      <div class="section">
        <h3>Discounts</h3>
        <table>
          <tr>
            <th>Description</th>
            <th>Amount (₹)</th>
          </tr>
          ${ride.fareBreakdown.referralDiscount > 0 ? `<tr><td>Referral Discount</td><td class="right">-${ride.fareBreakdown.referralDiscount.toFixed(2)}</td></tr>` : ''}
          ${ride.fareBreakdown.promoDiscount > 0 ? `<tr><td>Promo Code Discount</td><td class="right">-${ride.fareBreakdown.promoDiscount.toFixed(2)}</td></tr>` : ''}
        </table>
      </div>
      `
        : '';

    // Refund section
    const refundSection =
      ride.paymentStatus === 'refunded' || ride.refundStatus === 'processed'
        ? `
      <div class="section">
        <h3>Refund Details</h3>
        <table>
          <tr>
            <th>Refund Amount</th>
            <th>Refund Percentage</th>
            <th>Refund Reason</th>
            <th>Refund Status</th>
          </tr>
          <tr>
            <td>₹${(ride.refundAmount || 0).toFixed(2)}</td>
            <td>${ride.refundPercentage || 0}%</td>
            <td>${ride.refundReason || '-'}</td>
            <td>${(ride.refundStatus || '-').toUpperCase()}</td>
          </tr>
        </table>
      </div>
      `
        : '';

    const additionalInfo = `<div class="compact"><strong>Payment Status:</strong> <span style="color: ${ride.paymentStatus === 'paid' ? 'green' : 'red'};">${(ride.paymentStatus || 'N/A').toUpperCase()}</span></div>`;

    return `
      <html>
      <head>
        <style>${this.htmlTemplateService.generateBaseStyles()}</style>
      </head>
      <body>
        <div class="container">
          ${this.htmlTemplateService.generateInvoiceHeader('TAXI INVOICE', invoiceNo, additionalInfo)}
          
          <div class="section">
            <table>
              <tr>
                <th style="width: 50%;">Bill To:</th>
                <th style="width: 50%;">Ride Details:</th>
              </tr>
              <tr>
                <td>
                  <strong>${user.userName}</strong><br>
                  📞 ${user.userContact}<br>
                  📧 ${user.userEmail}
                </td>
                <td>
                  <strong>Ride ID:</strong> ${ride._id}<br>
                  <strong>Status:</strong> <span style="color: ${ride.status === 'completed' ? 'green' : 'orange'};">${(ride.status || 'N/A').toUpperCase()}</span><br>
                  <strong>Vehicle Type:</strong> ${(ride.vehicleType || 'N/A').toUpperCase()}<br>
                  <strong>Distance:</strong> ${(ride.distance || 0).toFixed(2)} km
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
                <td>${driver.driverName}</td>
                <td>${driver.driverContact}</td>
                <td>${driver.vehicleType}</td>
                <td>${driver.vehicleModel}</td>
                <td>${driver.vehicleNumber}</td>
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
                <td>${(ride.distance || 0).toFixed(2)} km</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <h3>Fare Breakdown</h3>
            <table>
              <tr>
                <th>Description</th>
                <th>Amount (₹)</th>
              </tr>
              <tr>
                <td>Base Fare</td>
                <td class="right">${(ride.fareBreakdown.baseFare || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>GST (${((ride.fareBreakdown.gstAmount / ride.fareBreakdown.baseFare) * 100).toFixed(2)}%)</td>
                <td class="right">${(ride.fareBreakdown.gstAmount || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Platform Fee</td>
                <td class="right">${(ride.fareBreakdown.platformFee || 0).toFixed(2)}</td>
              </tr>
              ${additionalChargesSection ? additionalChargesSection.replace('<div class="section"><h3>Additional Charges & Adjustments</h3><table>', '').replace('</table></div>', '') : ''}
              ${discountsSection ? discountsSection.replace('<div class="section"><h3>Discounts</h3><table>', '').replace('</table></div>', '') : ''}
              <tr class="total">
                <td><strong>Total Amount:</strong></td>
                <td class="right"><strong>₹${(ride.TotalFare || 0).toFixed(2)}</strong></td>
              </tr>
            </table>
          </div>

          <div class="earnings-breakdown">
            <h3>Earnings Distribution</h3>
            <table>
              <tr>
                <th>Description</th>
                <th>Amount (₹)</th>
              </tr>
              <tr>
                <td>Driver Earnings</td>
                <td class="right positive">₹${(ride.driverEarnings || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Platform Earnings</td>
                <td class="right">₹${(ride.platformEarnings || 0).toFixed(2)}</td>
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

          ${this.htmlTemplateService.generateFooter()}
        </div>
      </body>
      </html>
    `;
  }

  async TotalIncome(filter: string): Promise<Buffer> {
    const reportData = await this.generateReportData('income', filter);
    const html = this.generateReportHtml(reportData);
    return await this.pdfGeneratorService.generatePdfFromHtml(html);
  }

  async NewUsersReport(filter: string): Promise<Buffer> {
    const reportData = await this.generateReportData('users', filter);
    const html = this.generateReportHtml(reportData);
    return await this.pdfGeneratorService.generatePdfFromHtml(html);
  }

  async NewRidesReport(filter: string): Promise<Buffer> {
    const reportData = await this.generateReportData('rides', filter);
    const html = this.generateReportHtml(reportData);
    return await this.pdfGeneratorService.generatePdfFromHtml(html);
  }

  private async generateReportData(
    type: 'income' | 'users' | 'rides',
    filter: string,
  ): Promise<ReportData> {
    let filterDate: Date | null = null;
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
      default:
        filterDate = new Date(now.setMonth(now.getMonth() - 1));;
    }

    const query: any = {};
    if (filterDate) query.createdAt = { $gte: filterDate };

    let items: any[] = [];
    let total = 0;
    let summary: any = {};
    let qrData = '';
    let totalInWords = '';

    if (type === 'income') {
      query.paymentStatus = 'paid';
      items = await this.rideModel
        .find(query)
        .populate('bookedBy', 'name email')
        .populate('driver', 'name')
        .exec();

      total = items.reduce((sum, ride: any) => sum + (ride.TotalFare || 0), 0);
      totalInWords = toWords(Math.round(total));

      const totalRides = items.length;
      const totalDrivers = new Set(items.map((r) => r.driver?._id.toString())).size;
      const totalCustomers = new Set(items.map((r) => r.bookedBy?._id.toString())).size;
      const repeatCustomers = Array.from(
        items.reduce((map, ride) => {
          const id = ride.bookedBy?._id.toString();
          if (!id) return map;
          map.set(id, (map.get(id) || 0) + 1);
          return map;
        }, new Map<string, number>()),
      ).filter(([_, count]) => count > 1).length;

      qrData = await QRCode.toDataURL(
        `Total Amount: ₹${total.toFixed(2)}
Total Rides: ${totalRides}
Total Drivers: ${totalDrivers}
Total Customers: ${totalCustomers}
Repeat Customers: ${repeatCustomers}
Generated: ${new Date().toLocaleString('en-IN')}`,
      );

      summary = { totalRides, totalDrivers, totalCustomers, repeatCustomers };
    } else if (type === 'users') {
      items = await this.userModel.find(query).exec();
      total = items.length;

      const repeatUsers = Array.from(
        items.reduce((map: Map<string, number>, user) => {
          if (!user.contactNumber) return map;
          const contactNumber = String(user.contactNumber);
          map.set(contactNumber, (map.get(contactNumber) || 0) + 1);
          return map;
        }, new Map<string, number>()),
      ).filter(([_, count]) => count > 1).length;

      const roleCounts = items.reduce((acc: any, user: any) => {
        const role = (user.role || 'unknown').toLowerCase();
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {});

      qrData = await QRCode.toDataURL(
        `Total Users: ${total}
Repeat Users: ${repeatUsers}
Roles:
- Users: ${roleCounts['user'] || 0}
- Drivers: ${roleCounts['driver'] || 0}
- Admins: ${roleCounts['admin'] || 0}
Generated: ${new Date().toLocaleString('en-IN')}`,
      );

      summary = { repeatUsers, roleCounts };
    } else if (type === 'rides') {
      items = await this.rideModel
        .find(query)
        .populate('bookedBy', 'name contactNumber role')
        .populate('driver', 'name contactNumber role')
        .exec();

      total = items.length;
      const totalEarnings = items.reduce(
        (acc: number, ride: any) => acc + (ride.TotalFare || 0),
        0,
      );
      const statusCounts = items.reduce((acc: any, ride: any) => {
        const status = (ride.status || 'unknown').toLowerCase();
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      qrData = await QRCode.toDataURL(
        `Total Rides: ${total}
Completed: ${statusCounts['completed'] || 0}
Cancelled: ${statusCounts['cancelled'] || 0}
Pending: ${statusCounts['pending'] || 0}
Started: ${statusCounts['started'] || 0}
TotalEarnings: ${totalEarnings} ₹
Generated: ${new Date().toLocaleString('en-IN')}`,
      );

      summary = { totalEarnings, statusCounts };
    }

    const reportNo = this.generateReportNumber(
      type === 'income' ? 'INC' : type === 'users' ? 'USR' : 'RID',
      filter,
    );

    return {
      total,
      items,
      summary,
      filter,
      type,
      qrData,
      totalInWords,
      reportNo,
    };
  }

  private generateReportHtml(data: ReportData): string {
    const { type, items, total, summary, qrData, totalInWords, reportNo } = data;
    let title = '';
    let tableHeaders = '';
    let rows = '';

    if (type === 'income') {
      title = 'TOTAL INCOME REPORT';
      tableHeaders = `
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
      `;

      rows = items
        .map((ride: any, index: number) => {
          const pickup = ride.pickupLocation?.coordinates || [];
          const drop = ride.dropoffLocation?.coordinates || [];
          const pickupCoords =
            pickup.length === 2 ? `${pickup[1]}, ${pickup[0]}` : 'N/A';
          const dropCoords =
            drop.length === 2 ? `${drop[1]}, ${drop[0]}` : 'N/A';

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
        })
        .join('');
    } else if (type === 'users') {
      title = 'NEW USERS REPORT';
      tableHeaders = `
        <tr>
          <th>#</th>
          <th>User ID</th>
          <th>Name</th>
          <th>Contact Number</th>
          <th>Role</th>
          <th>Date</th>
          <th>Time</th>
        </tr>
      `;

      rows = items
        .map(
          (user: any, index: number) => `
        <tr>
          <td>${index + 1}</td>
          <td>${user._id}</td>
          <td>${user.name || 'N/A'}</td>
          <td>${user.contactNumber || 'N/A'}</td>
          <td>${user.role || 'N/A'}</td>
          <td>${new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
          <td>${new Date(user.createdAt).toLocaleTimeString('en-IN')}</td>
        </tr>
      `,
        )
        .join('');
    } else if (type === 'rides') {
      title = 'NEW RIDES REPORT';
      tableHeaders = `
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
      `;

      rows = items
        .map(
          (ride: any, index: number) => `
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
      `,
        )
        .join('');
    }

    let summaryRows = '';
    if (type === 'income') {
      summaryRows = `
        <tr class="total"><td colspan="9">TOTAL INCOME</td><td><strong>₹${total.toFixed(2)}</strong></td></tr>
      `;
    } else if (type === 'users') {
      summaryRows = `
        <tr class="total"><td colspan="6">TOTAL USERS</td><td>${total}</td></tr>
        <tr class="total"><td colspan="6">REPEAT USERS</td><td>${summary.repeatUsers || 0}</td></tr>
        <tr class="total"><td colspan="6">USERS</td><td>${summary.roleCounts?.['user'] || 0}</td></tr>
        <tr class="total"><td colspan="6">DRIVERS</td><td>${summary.roleCounts?.['driver'] || 0}</td></tr>
        <tr class="total"><td colspan="6">ADMINS</td><td>${summary.roleCounts?.['admin'] || 0}</td></tr>
      `;
    } else if (type === 'rides') {
      summaryRows = `
        <tr class="total"><td colspan="9">TOTAL RIDES</td><td>${total}</td></tr>
        <tr class="total"><td colspan="9">COMPLETED</td><td>${summary.statusCounts?.['completed'] || 0}</td></tr>
        <tr class="total"><td colspan="9">CANCELLED</td><td>${summary.statusCounts?.['cancelled'] || 0}</td></tr>
        <tr class="total"><td colspan="9">PENDING</td><td>${summary.statusCounts?.['pending'] || 0}</td></tr>
        <tr class="total"><td colspan="9">STARTED</td><td>${summary.statusCounts?.['started'] || 0}</td></tr>
        <tr class="total"><td colspan="9">TOTAL EARNINGS</td><td>${summary.totalEarnings || 0} ₹</td></tr>
      `;
    }

    return `
      <html>
      <head>
        <style>${this.htmlTemplateService.generateBaseStyles('#f4c311dc', '0.15')}</style>
      </head>
      <body>
        <div class="container">
         ${this.htmlTemplateService.generateReportHeader(title, reportNo || 'N/A')}
          
          <table>
            ${tableHeaders}
            ${rows || `<tr><td colspan="${type === 'income' ? 10 : type === 'users' ? 7 : 10}">No Data Found</td></tr>`}
            ${summaryRows}
          </table>

          ${type === 'income' && totalInWords
        ? `
          <div style="margin-top:12px; font-style:italic;">
            <strong>Amount in Words:</strong> ${totalInWords} rupees only
          </div>
          `
        : ''
      }

          <div style="margin-top:20px; text-align:center;">
            <img src="${qrData}" class="qr-code" />
            <div style="font-size:10px;">Scan for report verification</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async generateDriverInvoice(driverId: string, rideIds: string[]): Promise<Buffer> {
  const rides = await this.rideModel.find({ _id: { $in: rideIds } })
    .populate('bookedBy', 'name contactNumber email')
    .populate('driver', 'name contactNumber vehicleDetails')
    .exec();

  const totalEarnings = rides.reduce((sum, r) => sum + (r.driverEarnings || 0), 0);

  const qrCodeData = await this.generateQRCode({
    rideId: rides.map(r => r._id).join(','),
    totalFare: totalEarnings,
    driverEarnings: totalEarnings,
    driverName: String(rides[0]?.driver?._id)|| 'N/A',
    userName: String(rides[0]?.bookedBy?._id) || 'N/A',
    distance: rides.reduce((sum, r) => sum + (r.distance || 0), 0),
    // include other ride details as needed
  });

  const invoiceHtml = this.generateInvoiceHtml({
    ride: rides,
    user: rides[0]?.bookedBy,
    driver: rides[0]?.driver,
    pickupLocationName: 'Multiple',
    dropLocationName: 'Multiple',
    qrCodeData,
    totalInWords: toWords(Math.round(totalEarnings)),
    invoiceNo: `DRV-${new Date().getTime()}-${driverId}`,
  });

  return await this.pdfGeneratorService.generatePdfFromHtml(invoiceHtml);
}

}