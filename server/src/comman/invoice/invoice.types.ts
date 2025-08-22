
export interface QRCodeData {
  rideId?: string;
  totalFare?: number;
  status?: string;
  paymentStatus?: string;
  refundStatus?: string;
  refundAmount?: number;
  userName?: string;
  driverName?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  distance?: number;
  pickupLocation?: string;
  dropoffLocation?: string;
}

export interface ReportData {
  total: number;
  items: any[];
  summary?: any;
  filter?: string;
  type: 'income' | 'users' | 'rides';
}

export interface InvoiceData {
  ride: any;
  user: any;
  driver: any;
  pickupLocationName: string;
  dropLocationName: string;
  qrCodeData: string;
  totalInWords: string;
}