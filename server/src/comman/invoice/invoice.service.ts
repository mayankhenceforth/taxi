// import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model, Types } from 'mongoose';
// import { ConfigService } from '@nestjs/config';
// import * as puppeteer from 'puppeteer';
// import { toWords } from 'number-to-words';
// import * as QRCode from 'qrcode';
// import { Ride, RideDocument } from '../schema/ride.schema';
// import { User, UserDocument } from '../schema/user.schema';
// import axios from 'axios';

// interface QRCodeData {
//   rideId?: string;
//   totalFare?: number;
//   status?: string;
//   paymentStatus?: string;
//   refundStatus?: string;
//   refundAmount?: number;
// }

// @Injectable()
// export class InvoiceService {
//   constructor(
//     @InjectModel(Ride.name) private rideModel: Model<RideDocument>,
//     @InjectModel(User.name) private userModel: Model<UserDocument>,
//     private readonly configService: ConfigService,
//   ) { }

//   private dropLocationName: string;
//   private pickupLocationName: string;

//   async generateInvoice(rideId: string): Promise<Buffer> {
//     try {
//       const objectId = new Types.ObjectId(rideId);

//       const ride = await this.rideModel
//       .findById(objectId)
//       .populate('bookedBy', 'name email contactNumber') 
//       .populate({
//         path: 'driver',
//         select: 'name contactNumber', 
//         populate: { 
//           path: 'vehicleDetails', 
//           model: 'VehicleDetails',
//           select: 'type model numberPlate' 
//         }
//       })
//       .exec();

//       if (!ride) throw new Error('Ride not found');

//       const user = ride.bookedBy as any;
//       const driver = ride.driver as any;

//       // Add null checks for user and driver
//       if (!user) throw new Error('User not found');
//       if (!driver) throw new Error('Driver not found');

//       // Safe property access
//       const userName = user?.name || 'N/A';
//       const userContact = user?.contactNumber || 'N/A';
//       const userEmail = user?.email || 'N/A';

//       const driverName = driver?.name || 'N/A';
//       const driverContact = driver?.contactNumber || 'N/A';
//       const vehicleType = (driver?.vehicleDetails?.type || 'N/A').toUpperCase();
//       const vehicleModel = driver?.vehicleDetails?.model || 'N/A';
//       const vehicleNumber = driver?.vehicleDetails?.numberPlate || 'N/A';
//       // Reverse geocoding for pickup & drop locations
//       let pickupLocationName = 'N/A';
//       let dropLocationName = 'N/A';

//       try {
//         const pickupRes = await axios.get(
//           `https://api.geoapify.com/v1/geocode/reverse?lat=${ride.pickupLocation.coordinates[0]}&lon=${ride.pickupLocation.coordinates[1]}&apiKey=${this.configService.get<string>('GEOAPIFY_API_KEY')}`
//         );
//         pickupLocationName = pickupRes.data.features[0]?.properties?.formatted || 'N/A';
//       } catch (error) {
//         console.warn('Reverse geocoding failed for pickup location:', error.message);
//       }

//       try {
//         const dropRes = await axios.get(
//           `https://api.geoapify.com/v1/geocode/reverse?lat=${ride.dropoffLocation.coordinates[0]}&lon=${ride.dropoffLocation.coordinates[1]}&apiKey=${this.configService.get<string>('GEOAPIFY_API_KEY')}`
//         );
//         dropLocationName = dropRes.data.features[0]?.properties?.formatted || 'N/A';
//       } catch (error) {
//         console.warn('Reverse geocoding failed for drop location:', error.message);
//       }

//       this.pickupLocationName = pickupLocationName;
//       this.dropLocationName = dropLocationName;

//       const imageUrl = "https://res.cloudinary.com/dmedhsl41/image/upload/v1755751596/360_F_471467270_wdaTtaF6QWhqILrY0LGUZvpIXOtVEgGP-removebg-preview_g3rsyw.png";

//       const qrCodeData = await this.generateQRCode({
//         rideId: ride._id,
//         totalFare: ride.TotalFare,
//         status: ride.status,
//         paymentStatus: ride.paymentStatus,
//         refundStatus: ride.refundStatus,
//         refundAmount: ride.refundAmount
//       });

//       const rideIdString = rideId;

//       // Calculate total in words
//       const totalInWords = toWords(Math.round(ride.TotalFare));

//       // Refund section
//       const refundSection = ride.paymentStatus === 'refunded' || ride.refundStatus === 'processed'
//         ? `
//         <div class="section">
//           <h3>Refund Details</h3>
//           <table>
//             <tr>
//               <th>Refund Amount</th>
//               <th>Refund Percentage</th>
//               <th>Refund Reason</th>
//               <th>Refund Status</th>
//             </tr>
//             <tr>
//               <td>₹${(ride.refundAmount || 0).toFixed(2)}</td>
//               <td>${ride.refundPercentage || 0}%</td>
//               <td>${ride.refundReason || '-'}</td>
//               <td>${(ride.refundStatus || '-').toUpperCase()}</td>
//             </tr>
//           </table>
//         </div>
//         ` : '';

//       // Additional charges section
//       const additionalChargesSection = (ride.surgeCharge > 0 || ride.nightCharge > 0 || ride.tollFee > 0 ||
//         ride.parkingFee > 0 || ride.waitingCharge > 0 || ride.bonusAmount > 0)
//         ? `
//         <div class="section">
//           <h3>Additional Charges & Adjustments</h3>
//           <table>
//             <tr>
//               <th>Description</th>
//               <th>Amount (₹)</th>
//             </tr>
//             ${ride.surgeCharge > 0 ? `<tr><td>Surge Charge (${ride.surgeMultiplier}x)</td><td class="right">${ride.surgeCharge.toFixed(2)}</td></tr>` : ''}
//             ${ride.nightCharge > 0 ? `<tr><td>Night Charge</td><td class="right">${ride.nightCharge.toFixed(2)}</td></tr>` : ''}
//             ${ride.tollFee > 0 ? `<tr><td>Toll Fee</td><td class="right">${ride.tollFee.toFixed(2)}</td></tr>` : ''}
//             ${ride.parkingFee > 0 ? `<tr><td>Parking Fee</td><td class="right">${ride.parkingFee.toFixed(2)}</td></tr>` : ''}
//             ${ride.waitingCharge > 0 ? `<tr><td>Waiting Charge</td><td class="right">${ride.waitingCharge.toFixed(2)}</td></tr>` : ''}
//             ${ride.bonusAmount > 0 ? `<tr><td>Bonus Amount</td><td class="right">${ride.bonusAmount.toFixed(2)}</td></tr>` : ''}
//             ${ride.cancellationFee > 0 ? `<tr><td>Cancellation Fee</td><td class="right">${ride.cancellationFee.toFixed(2)}</td></tr>` : ''}
//           </table>
//         </div>
//         ` : '';

//       // Discounts section
//       const discountsSection = (ride.referralDiscount > 0 || ride.promoDiscount > 0)
//         ? `
//         <div class="section">
//           <h3>Discounts</h3>
//           <table>
//             <tr>
//               <th>Description</th>
//               <th>Amount (₹)</th>
//             </tr>
//             ${ride.referralDiscount > 0 ? `<tr><td>Referral Discount</td><td class="right">-${ride.referralDiscount.toFixed(2)}</td></tr>` : ''}
//             ${ride.promoDiscount > 0 ? `<tr><td>Promo Code Discount ${ride.promoCode ? `(${ride.promoCode})` : ''}</td><td class="right">-${ride.promoDiscount.toFixed(2)}</td></tr>` : ''}
//           </table>
//         </div>
//         ` : '';

//       const html = `
//         <html>
//         <head>
//           <style>
//             body { font-family: 'Helvetica', Arial, sans-serif; margin: 15px; font-size: 12px; color: #333; text-transform: uppercase; }
//             .container { max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
//             .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #fcad02dc; padding-bottom: 15px; }
//             .company-info { flex: 2; }
//             .company-name { font-size: 20px; font-weight: bold; color: #fcad02dc; margin-bottom: 5px; }
//             .company-details { font-size: 11px; color: #666; }
//             .invoice-info { flex: 1; text-align: right; }
//             .invoice-title { text-align: center; margin: 15px 0; font-size: 18px; font-weight: bold; color: #fcad02dc; }
//             table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
//             table, th, td { border: 1px solid #ddd; }
//             th, td { padding: 6px; text-align: left; }
//             th { background-color: #f8f9fa; font-weight: bold; }
//             .right { text-align: right; }
//             .total { font-weight: bold; background-color: #e6f7ff; }
//             .positive { color: #28a745; }
//             .negative { color: #dc3545; }
//             .amount-in-words { margin-top: 12px; font-style: italic; font-size: 11px; padding: 8px; background-color: #f9f9f9; border-left: 3px solid #fcad02dc; }
//             .section { margin-top: 15px; }
//             .section h3 { margin: 0 0 8px 0; font-size: 13px; color: #fcad02dc; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
//             .logo-container { display: flex; align-items: center; margin-bottom: 10px; }
//             .logo { width: 60px; height: 60px; background-color: #fcad02dc; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px; margin-right: 12px; }
//             .qr-code { width: 150px; height: 150px; margin-top: 10px; }
//             .footer { margin-top: 25px; text-align: center; font-size: 10px; color: #888; border-top: 1px solid #ddd; padding-top: 10px; }
//             .signature { margin-top: 30px; border-top: 1px dashed #ddd; padding-top: 10px; font-size: 11px; }
//             .compact { margin: 5px 0; }
//             .text-xs { font-size: 10px; }
//             .watermark { position: fixed; top: 50%; left: 50%; width: 350px; height: 350px; opacity: 0.20; transform: translate(-50%, -50%); z-index: 0; pointer-events: none; }
//             .logoImage { width: 100%; height: 100%; object-fit: cover; }
//             .earnings-breakdown { background-color: #f8f9fa; padding: 10px; border-radius: 5px; margin-top: 15px; }
//           </style>
//         </head>
//         <body>
//           <div class="container">
//             <div class="header">
//               <div class="company-info">
//                 <div class="logo-container">
//                   <div class="logo"><img src="${imageUrl}" class='logoImage' /></div>
//                   <img src="${imageUrl}" class="watermark" />
//                   <div class="company-name">RideShare Pro</div>
//                   <div class="company-details">
//                     <div>123 Ride Street, City Center</div>
//                     <div>+91 9876543210 • support@rideshare.com</div>
//                     <div>GSTIN: 27ABCDE1234F1Z5</div>
//                   </div>
//                 </div>
//               </div>
//               <div class="invoice-info">
//                 <div style="font-weight: bold; font-size: 16px;">TAXI INVOICE</div>
//                 <div class="compact"><strong>Invoice No:</strong> ${this.generateInvoiceNumber(rideIdString)}</div>
//                 <div class="compact"><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</div>
//                 <div class="compact"><strong>Time:</strong> ${new Date().toLocaleTimeString('en-IN')}</div>
//                 <div class="compact"><strong>Payment Status:</strong> <span style="color: ${ride.paymentStatus === 'paid' ? 'green' : 'red'};">${(ride.paymentStatus || 'N/A').toUpperCase()}</span></div>
//               </div>
//             </div>

//             <div class="section">
//               <table>
//                 <tr>
//                   <th style="width: 50%;">Bill To:</th>
//                   <th style="width: 50%;">Ride Details:</th>
//                 </tr>
//                 <tr>
//                   <td>
//                     <strong>${userName}</strong><br>
//                     📞 ${userContact}<br>
//                     📧 ${userEmail}
//                   </td>
//                   <td>
//                     <strong>Ride ID:</strong> ${rideIdString}<br>
//                     <strong>Status:</strong> <span style="color: ${ride.status === 'completed' ? 'green' : 'orange'};">${(ride.status || 'N/A').toUpperCase()}</span><br>
//                     <strong>Vehicle Type:</strong> ${(ride.vehicleType || 'N/A').toUpperCase()}<br>
//                     <strong>Distance:</strong> ${(ride.distance || 0).toFixed(2)} km
//                   </td>
//                 </tr>
//               </table>
//             </div>

//             <div class="section">
//               <h3>Driver & Vehicle Information</h3>
//               <table>
//                 <tr>
//                   <th>Driver Name</th>
//                   <th>Contact</th>
//                   <th>Vehicle Type</th>
//                   <th>Vehicle Model</th>
//                   <th>Vehicle Number</th>
//                 </tr>
//                 <tr>
//                   <td>${driverName}</td>
//                   <td>${driverContact}</td>
//                   <td>${vehicleType}</td>
//                   <td>${vehicleModel}</td>
//                   <td>${vehicleNumber}</td>
//                 </tr>
//               </table>
//             </div>

//             <div class="section">
//               <h3>Ride Route Details</h3>
//               <table>
//                 <tr>
//                   <th>Pickup Location</th>
//                   <th>Dropoff Location</th>
//                   <th>Distance</th>
//                 </tr>
//                 <tr>
//                   <td>${pickupLocationName}</td>
//                   <td>${dropLocationName}</td>
//                   <td>${(ride.distance || 0).toFixed(2)} km</td>
//                 </tr>
//               </table>
//             </div>

//             <div class="section">
//               <h3>Fare Breakdown</h3>
//               <table>
//                 <tr>
//                   <th>Description</th>
//                   <th>Amount (₹)</th>
//                 </tr>
//                 <tr>
//                   <td>Base Fare</td>
//                   <td class="right">${(ride.baseFare || 0).toFixed(2)}</td>
//                 </tr>
//                 <tr>
//                   <td>GST (${((ride.gstAmount / ride.baseFare) * 100).toFixed(2)}%)</td>
//                   <td class="right">${(ride.gstAmount || 0).toFixed(2)}</td>
//                 </tr>
//                 <tr>
//                   <td>Platform Fee</td>
//                   <td class="right">${(ride.platformFee || 0).toFixed(2)}</td>
//                 </tr>
//                 ${additionalChargesSection ? additionalChargesSection.replace('<div class="section"><h3>Additional Charges & Adjustments</h3><table>', '').replace('</table></div>', '') : ''}
//                 ${discountsSection ? discountsSection.replace('<div class="section"><h3>Discounts</h3><table>', '').replace('</table></div>', '') : ''}
//                 <tr class="total">
//                   <td><strong>Total Amount:</strong></td>
//                   <td class="right"><strong>₹${(ride.TotalFare || 0).toFixed(2)}</strong></td>
//                 </tr>
//               </table>
//             </div>

//             <div class="earnings-breakdown">
//               <h3>Earnings Distribution</h3>
//               <table>
//                 <tr>
//                   <th>Description</th>
//                   <th>Amount (₹)</th>
//                 </tr>
//                 <tr>
//                   <td>Driver Earnings</td>
//                   <td class="right positive">₹${(ride.driverEarnings || 0).toFixed(2)}</td>
//                 </tr>
//                 <tr>
//                   <td>Platform Earnings</td>
//                   <td class="right">₹${(ride.platformEarnings || 0).toFixed(2)}</td>
//                 </tr>
//               </table>
//             </div>

//             ${refundSection}

//             <div class="amount-in-words">
//               <strong>Amount in Words:</strong> ${totalInWords} rupees only
//             </div>

//             <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px;">
//               <div class="signature" style="flex: 2;">
//                 <div>Authorized Signature</div>
//                 <div class="text-xs">For RideShare Pro</div>
//                 <div class="text-xs">Date: ${new Date().toLocaleDateString('en-IN')}</div>
//               </div>

//               <div style="flex: 1; text-align: center;">
//                 <img src="${qrCodeData}" class="qr-code" alt="Ride QR Code">
//                 <div class="text-xs">Scan to view ride details</div>
//               </div>

//               <div class="signature" style="flex: 2; text-align: right;">
//                 <div>Customer Signature</div>
//                 <div class="text-xs">I acknowledge receipt of services</div>
//                 <div class="text-xs">Date: ________________</div>
//               </div>
//             </div>

//             <div class="footer">
//               <div>Thank you for choosing RideShare Pro!</div>
//               <div>This is a computer-generated invoice • www.rideshare.com</div>
//               <div>For queries: support@rideshare.com • +91 9876543210</div>
//             </div>
//           </div>
//         </body>
//         </html>
//       `;

//       const browser = await puppeteer.launch({
//         args: ['--no-sandbox', '--disable-setuid-sandbox'],
//       });
//       const page = await browser.newPage();
//       await page.setContent(html, { waitUntil: 'networkidle0' });

//       const pdfUint8Array = await page.pdf({
//         format: 'A4',
//         printBackground: true,
//         margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
//       });

//       await browser.close();
//       return Buffer.from(pdfUint8Array);

//     } catch (error) {
//       console.error('Error generating invoice:', error);
//       throw new Error(`Failed to generate invoice: ${error.message}`);
//     }
//   }


//   async TotalIncome(filter: string): Promise<Buffer> {
//     // 🎨 Theme Colors
//     const primaryColor = "#f4c311dc";
//     const watermarkOpacity = "0.15";

//     // --- Filter calculation ---
//     let filterDate: Date | null = null;
//     const now = new Date();

//     switch (filter) {
//       case '1h': filterDate = new Date(now.getTime() - 60 * 60 * 1000); break;
//       case '1d': filterDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
//       case '1w': filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
//       case '1m': filterDate = new Date(now.setMonth(now.getMonth() - 1)); break;
//       default: filterDate = null;
//     }

//     const query: any = { paymentStatus: 'paid' };
//     if (filterDate) query.createdAt = { $gte: filterDate };

//     // --- Fetch rides ---
//     const rides = await this.rideModel
//       .find(query)
//       .populate('bookedBy', 'name email')
//       .populate('driver', 'name')
//       .exec();

//     const totalIncome = rides.reduce((sum, ride: any) => sum + (ride.TotalFare || 0), 0);
//     const totalInWords = toWords(Math.round(totalIncome));

//     // --- Calculate summary stats for QR ---
//     const totalRides = rides.length;
//     const totalDrivers = new Set(rides.map(r => r.driver?._id.toString())).size;
//     const totalCustomers = new Set(rides.map(r => r.bookedBy?._id.toString())).size;
//     const repeatCustomers = Array.from(
//       rides.reduce((map, ride) => {
//         const id = ride.bookedBy?._id.toString();
//         if (!id) return map;
//         map.set(id, (map.get(id) || 0) + 1);
//         return map;
//       }, new Map<string, number>())
//     ).filter(([_, count]) => count > 1).length;

//     // --- QR code ---
//     const qrData = await QRCode.toDataURL(
//       `Total Amount: ₹${totalIncome.toFixed(2)}
// Total Rides: ${totalRides}
// Total Drivers: ${totalDrivers}
// Total Customers: ${totalCustomers}
// Repeat Customers: ${repeatCustomers}
// Generated: ${new Date().toLocaleString('en-IN')}`,

//     );


//     const imageUrl = "https://res.cloudinary.com/dmedhsl41/image/upload/v1755751596/360_F_471467270_wdaTtaF6QWhqILrY0LGUZvpIXOtVEgGP-removebg-preview_g3rsyw.png";

//     const invoiceNo = `INC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${filter || 'ALL'}`;

//     // --- Table rows ---
//     const rows = rides.map((ride: any, index: number) => {
//       const pickup = ride.pickupLocation?.coordinates || [];
//       const drop = ride.dropoffLocation?.coordinates || [];
//       const pickupCoords = pickup.length === 2 ? `${pickup[1]}, ${pickup[0]}` : 'N/A';
//       const dropCoords = drop.length === 2 ? `${drop[1]}, ${drop[0]}` : 'N/A';

//       return `
//       <tr>
//         <td>${index + 1}</td>
//         <td>${ride._id}</td>
//         <td>${ride.vehicleType || 'N/A'}</td>
//         <td>${ride.distance?.toFixed(2) || 0} km</td>
//         <td>₹${ride.TotalFare?.toFixed(2) || 0}</td>
//         <td>${ride.bookedBy?.name || 'N/A'}</td>
//         <td>${ride.driver?.name || 'N/A'}</td>
//         <td>${pickupCoords}</td>
//         <td>${dropCoords}</td>
//         <td>${new Date(ride.createdAt).toLocaleDateString('en-IN')}</td>
//       </tr>
//     `;
//     }).join('');

//     // --- HTML template ---
//     const html = `
//     <html>
//     <head>
//       <style>
//         body { font-family: 'Helvetica', Arial, sans-serif; margin: 15px; font-size: 12px; color: #333; text-transform: uppercase; }
//         .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
//         .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid ${primaryColor}; padding-bottom: 15px; }
//         .company-info { flex: 2; }
//         .company-name { font-size: 20px; font-weight: bold; color: ${primaryColor}; margin-bottom: 5px; }
//         .company-details { font-size: 11px; color: #666; }
//         .invoice-info { flex: 1; text-align: right; }
//         .logo-container { display: flex; align-items: center; margin-bottom: 10px; }
//         .logo { width: 60px; height: 60px; background-color: ${primaryColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px; }
//         .qr-code { width: 120px; height: 120px; margin-top: 10px;  }
//         .watermark { position: fixed; top: 50%; left: 50%; width: 350px; height: 350px; opacity: ${watermarkOpacity}; transform: translate(-50%, -50%); z-index: 0; pointer-events: none; }
//         table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
//         table, th, td { border: 1px solid #ddd; }
//         th, td { padding: 6px; text-align: center; }
//         th { background-color: #f8f9fa; font-weight: bold; }
//         .total { font-weight: bold; background-color: #e6f7ff; }
//       </style>
//     </head>
//     <body>
//       <div class="container">
//         <div class="header">
//           <div class="company-info">
//             <div class="logo-container">
//               <div class="logo"><img src="${imageUrl}" style="width:100%; height:100%;" /></div>
//               <img src="${imageUrl}" class="watermark" />
//               <div>
//                 <div class="company-name">RideShare Pro</div>
//                 <div class="company-details">
//                   <div>123 Ride Street, City Center</div>
//                   <div>+91 9876543210 • support@rideshare.com</div>
//                   <div>GSTIN: 27ABCDE1234F1Z5</div>
//                 </div>
//               </div>
//             </div>
//           </div>
//           <div class="invoice-info">
//             <div style="font-weight: bold; font-size: 16px;">TOTAL INCOME REPORT</div>
//             <div><strong>Invoice No:</strong> ${invoiceNo}</div>
//             <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</div>
//             <div><strong>Time:</strong> ${new Date().toLocaleTimeString('en-IN')}</div>
//           </div>
//         </div>

//         <table>
//           <tr>
//             <th>#</th>
//             <th>Ride ID</th>
//             <th>Vehicle</th>
//             <th>Distance</th>
//             <th>Fare (₹)</th>
//             <th>Customer</th>
//             <th>Driver</th>
//             <th>Pickup (Lat, Lon)</th>
//             <th>Drop (Lat, Lon)</th>
//             <th>Date</th>
//           </tr>
//           ${rows || `<tr><td colspan="10">No Paid Rides Found</td></tr>`}
//           <tr class="total">
//             <td colspan="9">TOTAL INCOME</td>
//             <td><strong>₹${totalIncome.toFixed(2)}</strong></td>
//           </tr>
//         </table>

//         <div style="margin-top:12px; font-style:italic;">
//           <strong>Amount in Words:</strong> ${totalInWords} rupees only
//         </div>

//         <div style="margin-top:20px; text-align:center ; ">
//           <img src="${qrData}" class="qr-code" />
//           <div style="font-size:10px;">Scan for report verification</div>
//         </div>
//       </div>
//     </body>
//     </html>
//   `;

//     // --- Generate PDF ---
//     const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
//     const page = await browser.newPage();
//     await page.setContent(html, { waitUntil: 'networkidle0' });

//     const pdfUint8Array = await page.pdf({
//       format: 'A4',
//       printBackground: true,
//       margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
//     });
//     await browser.close();
//     return Buffer.from(pdfUint8Array);
//   }

//   async NewUsersReport(filter: string): Promise<Buffer> {
//     const primaryColor = "#f4c311dc";
//     const watermarkOpacity = "0.15";

//     // --- Filter calculation ---
//     let filterDate: Date | null = null;
//     const now = new Date();

//     switch (filter) {
//       case '1h': filterDate = new Date(now.getTime() - 60 * 60 * 1000); break;
//       case '1d': filterDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
//       case '1w': filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
//       case '1m': filterDate = new Date(now.setMonth(now.getMonth() - 1)); break;
//       default: filterDate = null;
//     }

//     const query: any = {};
//     if (filterDate) query.createdAt = { $gte: filterDate };

//     // --- Fetch users ---
//     const users = await this.userModel.find(query).exec();
//     const totalUsers = users.length;

//     // Count repeat users by contactNumber
//     const repeatUsers = Array.from(
//       users.reduce((map: Map<string, number>, user) => {
//         if (!user.contactNumber) return map;
//         const contactNumber = String(user.contactNumber);
//         map.set(contactNumber, (map.get(contactNumber) || 0) + 1);
//         return map;
//       }, new Map<string, number>())
//     ).filter(([_, count]) => count > 1).length;

//     // --- Role counts ---
//     const roleCounts = users.reduce((acc: any, user: any) => {
//       const role = (user.role || "unknown").toLowerCase();
//       acc[role] = (acc[role] || 0) + 1;
//       return acc;
//     }, {});

//     // --- QR code ---
//     const qrData = await QRCode.toDataURL(
//       `Total Users: ${totalUsers}
// Repeat Users: ${repeatUsers}
// Roles:
// - Users: ${roleCounts["user"] || 0}
// - Drivers: ${roleCounts["driver"] || 0}
// - Admins: ${roleCounts["admin"] || 0}
// Generated: ${new Date().toLocaleString('en-IN')}`,

//     );

//     const imageUrl = "https://res.cloudinary.com/dmedhsl41/image/upload/v1755751596/360_F_471467270_wdaTtaF6QWhqILrY0LGUZvpIXOtVEgGP-removebg-preview_g3rsyw.png";

//     const invoiceNo = `USR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${filter || 'ALL'}`;

//     // --- Table rows ---
//     const rows = users.map((user: any, index: number) => `
//       <tr>
//         <td>${index + 1}</td>
//         <td>${user._id}</td>
//         <td>${user.name || 'N/A'}</td>
//         <td>${user.contactNumber || 'N/A'}</td>
//         <td>${user.role || 'N/A'}</td>
//         <td>${new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
//         <td>${new Date(user.createdAt).toLocaleTimeString('en-IN')}</td>
//       </tr>
//     `).join('');

//     // --- HTML template ---
//     const html = `
//     <html>
//     <head>
//       <style>
//         body { font-family: 'Helvetica', Arial , sans-serif; margin: 15px; font-size: 12px; color: #333; text-transform: capitalize; }
//         .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
//         .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid ${primaryColor}; padding-bottom: 15px; }
//         .company-info { flex: 2; }
//         .company-name { font-size: 20px; font-weight: bold; color: ${primaryColor}; margin-bottom: 5px; }
//         .company-details { font-size: 11px; color: #666; }
//         .invoice-info { flex: 1; text-align: right; }
//         .logo-container { display: flex; align-items: center; margin-bottom: 10px; }
//         .logo { width: 60px; height: 60px; background-color: ${primaryColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px; }
//         .qr-code { width: 180px; height: 180px; margin-top: 10px; }
//         .watermark { position: fixed; top: 50%; left: 50%; width: 350px; height: 350px; opacity: ${watermarkOpacity}; transform: translate(-50%, -50%); z-index: 0; pointer-events: none; }
//         table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
//         table, th, td { border: 1px solid #ddd; }
//         th, td { padding: 6px; text-align: center; }
//         th { background-color: #f8f9fa; font-weight: bold; }
//         .total { font-weight: bold; background-color: #e6f7ff; }
//       </style>
//     </head>
//     <body>
//       <div class="container">
//         <div class="header">
//           <div class="company-info">
//             <div class="logo-container">
//               <div class="logo"><img src="${imageUrl}" style="width:100%; height:100%;" /></div>
//               <img src="${imageUrl}" class="watermark" />
//               <div>
//                 <div class="company-name">RideShare Pro</div>
//                 <div class="company-details">
//                   <div>123 Ride Street, City Center</div>
//                   <div>+91 9876543210 • support@rideshare.com</div>
//                   <div>GSTIN: 27ABCDE1234F1Z5</div>
//                 </div>
//               </div>
//             </div>
//           </div>
//           <div class="invoice-info">
//             <div style="font-weight: bold; font-size: 16px;">NEW USERS REPORT</div>
//             <div><strong>Report No:</strong> ${invoiceNo}</div>
//             <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</div>
//             <div><strong>Time:</strong> ${new Date().toLocaleTimeString('en-IN')}</div>
//           </div>
//         </div>

//         <table>
//           <tr>
//             <th>#</th>
//             <th>User ID</th>
//             <th>Name</th>
//             <th>Contact Number</th>
//             <th>Role</th>
//             <th>Date</th>
//             <th>Time</th>
//           </tr>
//           ${rows || `<tr><td colspan="7">No Users Found</td></tr>`}
//           <tr class="total">
//             <td colspan="6">TOTAL USERS</td>
//             <td>${totalUsers}</td>
//           </tr>
//           <tr class="total">
//             <td colspan="6">REPEAT USERS</td>
//             <td>${repeatUsers}</td>
//           </tr>
//           <tr class="total">
//             <td colspan="6">USERS</td>
//             <td>${roleCounts["user"] || 0}</td>
//           </tr>
//           <tr class="total">
//             <td colspan="6">DRIVERS</td>
//             <td>${roleCounts["driver"] || 0}</td>
//           </tr>
//           <tr class="total">
//             <td colspan="6">ADMINS</td>
//             <td>${roleCounts["admin"] || 0}</td>
//           </tr>
//         </table>

//         <div style="margin-top:20px; text-align:center;">
//           <img src="${qrData}" class="qr-code" />
//           <div style="font-size:10px;">Scan for report verification</div>
//         </div>
//       </div>
//     </body>
//     </html>
//   `;

//     // --- Generate PDF ---
//     const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
//     const page = await browser.newPage();
//     await page.setContent(html, { waitUntil: 'networkidle0' });

//     const pdfUint8Array = await page.pdf({
//       format: 'A4',
//       printBackground: true,
//       margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
//     });

//     await browser.close();
//     return Buffer.from(pdfUint8Array);
//   }

//   async NewRidesReport(filter: string): Promise<Buffer> {
//     const primaryColor = "#f4c311dc";
//     const watermarkOpacity = "0.15";

//     // --- Filter calculation ---
//     let filterDate: Date | null = null;
//     const now = new Date();

//     switch (filter) {
//       case '1h': filterDate = new Date(now.getTime() - 60 * 60 * 1000); break;
//       case '1d': filterDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
//       case '1w': filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
//       case '1m': filterDate = new Date(now.setMonth(now.getMonth() - 1)); break;
//       default: filterDate = null;
//     }

//     const query: any = {};
//     if (filterDate) query.createdAt = { $gte: filterDate };

//     // --- Fetch rides ---
//     const rides = await this.rideModel.find(query)
//       .populate("bookedBy", "name contactNumber role")   // ✅ corrected
//       .populate("driver", "name contactNumber role")     // ✅ corrected
//       .exec();

//     const totalRides = rides.length;
//     const totalEarnings = rides.reduce((acc: number, ride: any) => acc + (ride.TotalFare || 0), 0);
//     const statusCounts = rides.reduce((acc: any, ride: any) => {
//       const status = (ride.status || "unknown").toLowerCase();
//       acc[status] = (acc[status] || 0) + 1;
//       return acc;
//     }, {});

//     // --- QR Code summary ---
//     const qrData = await QRCode.toDataURL(
//       `Total Rides: ${totalRides}
// Completed: ${statusCounts["completed"] || 0}
// Cancelled: ${statusCounts["cancelled"] || 0}
// Pending: ${statusCounts["pending"] || 0}
// Started: ${statusCounts["started"] || 0}
// TotalEarnings: ${totalEarnings} ₹
// Generated: ${new Date().toLocaleString('en-IN')}`,

//     );

//     const imageUrl = "https://res.cloudinary.com/dmedhsl41/image/upload/v1755751596/360_F_471467270_wdaTtaF6QWhqILrY0LGUZvpIXOtVEgGP-removebg-preview_g3rsyw.png";
//     const invoiceNo = `RID-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${filter || 'ALL'}`;

//     // --- Table rows ---
//     const rows = rides.map((ride: any, index: number) => `
//     <tr>
//       <td>${index + 1}</td>
//       <td>${ride._id}</td>
//       <td>${ride.bookedBy?.name || 'N/A'} (${ride.bookedBy?.contactNumber || 'N/A'}) [${ride.bookedBy?.role || 'User'}]</td>
//       <td>${ride.driver?.name || 'N/A'} (${ride.driver?.contactNumber || 'N/A'}) [${ride.driver?.role || 'Driver'}]</td>
//       <td>${ride.pickupLocation?.coordinates ? `${ride.pickupLocation.coordinates[1]}, ${ride.pickupLocation.coordinates[0]}` : 'N/A'}</td>
//       <td>${ride.dropoffLocation?.coordinates ? `${ride.dropoffLocation.coordinates[1]}, ${ride.dropoffLocation.coordinates[0]}` : 'N/A'}</td>
//       <td>${ride.TotalFare || '0'} ₹</td>
//       <td>${ride.status || 'N/A'}</td>
//       <td>${new Date(ride.createdAt).toLocaleDateString('en-IN')}</td>
//       <td>${new Date(ride.createdAt).toLocaleTimeString('en-IN')}</td>
//     </tr>
//   `).join('');

//     // --- HTML template ---
//     const html = `
//     <html>
//     <head>
//       <style>
//         body { font-family: 'Helvetica', Arial, sans-serif; margin: 15px; font-size: 12px; color: #333; text-transform: uppercase; }
//         .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
//         .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid ${primaryColor}; padding-bottom: 15px; }
//         .company-info { flex: 2; }
//         .company-name { font-size: 20px; font-weight: bold; color: ${primaryColor}; margin-bottom: 5px; }
//         .company-details { font-size: 11px; color: #666; }
//         .invoice-info { flex: 1; text-align: right; }
//         .logo-container { display: flex; align-items: center; margin-bottom: 10px; }
//         .logo { width: 60px; height: 60px; background-color: ${primaryColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px; }
//         .qr-code { width: 180px; height: 180px; margin-top: 10px; }
//         .watermark { position: fixed; top: 50%; left: 50%; width: 350px; height: 350px; opacity: ${watermarkOpacity}; transform: translate(-50%, -50%); z-index: 0; pointer-events: none; }
//         table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10px; }
//         table, th, td { border: 1px solid #ddd; }
//         th, td { padding: 5px; text-align: center; }
//         th { background-color: #f8f9fa; font-weight: bold; }
//         .total { font-weight: bold; background-color: #e6f7ff; }
//       </style>
//     </head>
//     <body>
//       <div class="container">
//         <div class="header">
//           <div class="company-info">
//             <div class="logo-container">
//               <div class="logo"><img src="${imageUrl}" style="width:100%; height:100%;" /></div>
//               <img src="${imageUrl}" class="watermark" />
//               <div>
//                 <div class="company-name">RideShare Pro</div>
//                 <div class="company-details">
//                   <div>123 Ride Street, City Center</div>
//                   <div>+91 9876543210 • support@rideshare.com</div>
//                   <div>GSTIN: 27ABCDE1234F1Z5</div>
//                 </div>
//               </div>
//             </div>
//           </div>
//           <div class="invoice-info">
//             <div style="font-weight: bold; font-size: 16px;">NEW RIDES REPORT</div>
//             <div><strong>Report No:</strong> ${invoiceNo}</div>
//             <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</div>
//             <div><strong>Time:</strong> ${new Date().toLocaleTimeString('en-IN')}</div>
//           </div>
//         </div>

//         <table>
//           <tr>
//             <th>#</th>
//             <th>Ride ID</th>
//             <th>User</th>
//             <th>Driver</th>
//             <th>Pickup</th>
//             <th>Drop</th>
//             <th>Fare</th>
//             <th>Status</th>
//             <th>Date</th>
//             <th>Time</th>
//           </tr>
//           ${rows || `<tr><td colspan="10">No Rides Found</td></tr>`}
//           <tr class="total"><td colspan="9">TOTAL RIDES</td><td>${totalRides}</td></tr>
//           <tr class="total"><td colspan="9">COMPLETED</td><td>${statusCounts["completed"] || 0}</td></tr>
//           <tr class="total"><td colspan="9">CANCELLED</td><td>${statusCounts["cancelled"] || 0}</td></tr>
//           <tr class="total"><td colspan="9">PENDING</td><td>${statusCounts["pending"] || 0}</td></tr>
//           <tr class="total"><td colspan="9">STARTED</td><td>${statusCounts["started"] || 0}</td></tr>
//           <tr class="total"><td colspan="9">TOTAL EARNINGS</td><td>${totalEarnings} ₹</td></tr>
//         </table>

//         <div style="margin-top:20px; text-align:center;">
//           <img src="${qrData}" class="qr-code" />
//           <div style="font-size:10px;">Scan for report verification</div>
//         </div>
//       </div>
//     </body>
//     </html>
//   `;

//     // --- Generate PDF ---
//     const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
//     const page = await browser.newPage();
//     await page.setContent(html, { waitUntil: 'networkidle0' });

//     const pdfUint8Array = await page.pdf({
//       format: 'A4',
//       printBackground: true,
//       margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
//     });

//     await browser.close();
//     return Buffer.from(pdfUint8Array);
//   }






//   private async generateQRCode(ride: any): Promise<string> {
//     const qrText = `
// Ride ID: ${ride._id}
// Status: ${ride.status}
// Rider: ${ride.bookedBy.name}
// Driver: ${ride.driver.name}
// Vehicle: ${ride.vehicleType.toUpperCase()} (${ride.driver.vehicleDetails?.numberPlate || 'N/A'})
// Distance: ${ride.distance.toFixed(2)} km
// Fare: ₹${ride.totalFare.toFixed(2)}
// Pickup: ${this.pickupLocationName}
// Dropoff: ${this.dropLocationName}
// Date: ${new Date().toLocaleDateString('en-IN')}
// Time: ${new Date().toLocaleTimeString('en-IN')}
//     `.trim();

//     return await QRCode.toDataURL(qrText, {
//       width: 250,
//       margin: 2,
//       color: { dark: '#e7a20cff', light: '#ffffff' },
//     });
//   }

//   private generateInvoiceNumber(rideId: string): string {
//     const date = new Date();
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const day = String(date.getDate()).padStart(2, '0');
//     return `INV-${year}${month}${day}-${rideId}`;
//   }
// }







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
  ) {}

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
          select: 'type model numberPlate'
        }
      })
      .exec();

    if (!ride) throw new Error('Ride not found');

    // Fallback if population didn't work
    if (!ride.bookedBy || typeof ride.bookedBy === 'string') {
      const user = await this.userModel.findById(ride.bookedBy).select('name email contactNumber').exec();
      ride.bookedBy = user as any;
    }

    if (!ride.driver || typeof ride.driver === 'string') {
      const driver = await this.userModel.findById(ride.driver)
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
    const qrText = `
Ride ID: ${data.rideId || 'N/A'}
Status: ${data.status || 'N/A'}
Total Fare: ₹${data.totalFare?.toFixed(2) || '0.00'}
Payment Status: ${data.paymentStatus || 'N/A'}
${data.refundStatus ? `Refund Status: ${data.refundStatus}` : ''}
${data.refundAmount ? `Refund Amount: ₹${data.refundAmount.toFixed(2)}` : ''}
Date: ${new Date().toLocaleDateString('en-IN')}
Time: ${new Date().toLocaleTimeString('en-IN')}
    `.trim();

    return await QRCode.toDataURL(qrText, {
      width: 250,
      margin: 2,
      color: { dark: '#e7a20cff', light: '#ffffff' },
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

  // Main methods
  async generateInvoice(rideId: string): Promise<Buffer> {
    try {
      if(!rideId) throw new BadRequestException("ride id requerde")
      const ride = await this.safePopulateRide(rideId);
      const userDriverInfo = this.extractUserDriverInfo(ride);

      const [pickupLocationName, dropLocationName] = await Promise.all([
        this.geocodingService.reverseGeocode(
          ride.pickupLocation.coordinates[0],
          ride.pickupLocation.coordinates[1]
        ),
        this.geocodingService.reverseGeocode(
          ride.dropoffLocation.coordinates[0],
          ride.dropoffLocation.coordinates[1]
        )
      ]);

      const qrCodeData = await this.generateQRCode({
        rideId: ride._id as string,
        totalFare: ride.TotalFare,
        status: ride.status,
        paymentStatus: ride.paymentStatus,
        refundStatus: ride.refundStatus,
        refundAmount: ride.refundAmount
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
        invoiceNo
      });

      return await this.pdfGeneratorService.generatePdfFromHtml(html);

    } catch (error) {
      console.error('Error generating invoice:', error);
      throw new Error(`Failed to generate invoice: ${error.message}`);
    }
  }

  private generateInvoiceHtml(data: any): string {
    const { ride, user, driver, pickupLocationName, dropLocationName, qrCodeData, totalInWords, invoiceNo } = data;

    // ... (your existing HTML generation logic, but using the reusable components)
    // This would use the HtmlTemplateService methods
    return `
      <html>
      <head>
        <style>${this.htmlTemplateService.generateBaseStyles()}</style>
      </head>
      <body>
        <div class="container">
          ${this.htmlTemplateService.generateInvoiceHeader(
            'TAXI INVOICE',
            invoiceNo,
            `<div class="compact"><strong>Payment Status:</strong> <span style="color: ${ride.paymentStatus === 'paid' ? 'green' : 'red'};">${(ride.paymentStatus || 'N/A').toUpperCase()}</span></div>`
          )}
          <!-- Rest of your invoice content -->
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

  private async generateReportData(type: 'income' | 'users' | 'rides', filter: string): Promise<ReportData> {
    // ... your existing report data generation logic
    return { total: 0, items: [], type, filter };
  }

  private generateReportHtml(data: ReportData): string {
    // ... your existing report HTML generation logic
    return '';
  }
}