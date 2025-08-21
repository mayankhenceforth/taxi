import { RideService } from './ride.service';
import { CreateRideDto } from './dto/create-ride.dto';
import { VerifyRideOtpDto } from './dto/verify-ride-otp.dto';
import { cencelRideDto } from './dto/cencel-ride.dto';
import { Response } from 'express';
import { PaymentService } from 'src/comman/payment/payment.service';
import { InvoiceService } from 'src/comman/invoice/invoice.service';
export declare class RideController {
    private readonly rideService;
    private readonly paymentService;
    private readonly invoiceService;
    constructor(rideService: RideService, paymentService: PaymentService, invoiceService: InvoiceService);
    create(request: any, createRideDto: CreateRideDto): Promise<import("../../comman/helpers/api-response").default<any>>;
    handleAcceptRide(rideId: string, request: any): Promise<import("../../comman/helpers/api-response").default<any>>;
    handleOtpRide(rideId: string, request: any, verifyRideOtpDto: VerifyRideOtpDto): Promise<import("../../comman/helpers/api-response").default<any>>;
    handleCancelRide(rideId: string, request: any, cancelRideDto: cencelRideDto): Promise<import("../../comman/helpers/api-response").default<any>>;
    handlePaymentRide(rideId: string, request: any): Promise<import("../../comman/helpers/api-response").default<any>>;
    confirmRidePayment(rideId: string, res: Response): Promise<void>;
}
