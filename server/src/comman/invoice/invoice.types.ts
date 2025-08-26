export interface QRCodeData {
  rideId?: string;
  totalFare?: number;
  status?: string;
  paymentStatus?: string;
  refundStatus?: string;
  refundAmount?: number;
  refundPercentage?: number;
  refundReason?: string;
  userName?: string;
  userContact?: string;
  userEmail?: string;
  driverName?: string;
  driverContact?: string;
  vehicleType?: string;
  vehicleModel?: string;
  vehicleNumber?: string;
  distance?: number;
  pickupLocation?: string;
  dropoffLocation?: string;
  baseFare?: number;
  gstAmount?: number;
  platformFee?: number;
  surgeCharge?: number;
  nightCharge?: number;
  tollFee?: number;
  parkingFee?: number;
  waitingCharge?: number;
  bonusAmount?: number;
  referralDiscount?: number;
  promoDiscount?: number;
  driverEarnings?: number;
  platformEarnings?: number;
}
export interface ReportData {
  total: number;
  items: any[];
  summary?: any;
  filter?: string;
  type: 'income' | 'users' | 'rides';
  qrData?: string;
  totalInWords?: string;
  reportNo?: string;
}

export interface InvoiceData {
  ride: any;
  user: any;
  driver: any;
  pickupLocationName: string;
  dropLocationName: string;
  qrCodeData: string;
  totalInWords: string;
  invoiceNo: string;
}