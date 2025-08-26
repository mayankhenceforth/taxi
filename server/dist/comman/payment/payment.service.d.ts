import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Model } from 'mongoose';
import { RideDocument } from '../schema/ride.schema';
import { InvoiceService } from '../invoice/invoice.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PaymentDocument } from '../schema/payment.schema';
import { DriverEarningDocument } from '../schema/driver-earnings.schema';
import { DriverPayoutDocument } from '../schema/payout.schema';
import { DriverPaymentDocument } from '../schema/DriverPaymentInfo.schema';
export declare class PaymentService {
    private readonly configService;
    private readonly rideModel;
    private paymentModel;
    private readonly driverPayoutModel;
    private readonly driverEarningModel;
    private readonly driverPaymentModel;
    private readonly invoiceService;
    private readonly cloudinaryService;
    private stripe;
    constructor(configService: ConfigService, rideModel: Model<RideDocument>, paymentModel: Model<PaymentDocument>, driverPayoutModel: Model<DriverPayoutDocument>, driverEarningModel: Model<DriverEarningDocument>, driverPaymentModel: Model<DriverPaymentDocument>, invoiceService: InvoiceService, cloudinaryService: CloudinaryService);
    createCheckoutSession(successUrl: string, cancelUrl: string, totalAmount: number, rideId: string): Promise<string>;
    handleWebhook(rawBody: Buffer, sig: string): Promise<{
        received: boolean;
    }>;
    handleRefund(rideId: string): Promise<{
        message: string;
        refundId: string;
        status: string | null;
        refundedAmount: number;
        refundPercentage: number;
        driverEarningAmount: number;
        driverEarningPercentage: number;
        plateformEarning: number;
    }>;
    createCustomer(email: string, paymentMethodId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            email: string | null;
        };
    }>;
    createSubscription(customerId: string, priceId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            subscriptionId: string;
            status: Stripe.Subscription.Status;
            plan: string | null;
            price: number;
            currency: string;
        };
    }>;
    createSubscriptionWithCheckout(priceId: string, customerId: string, successUrl: string, cancelUrl: string): Promise<{
        success: boolean;
        message: string;
        data: {
            url: string | null;
            id: string;
        };
    }>;
    handleUpdateSubscriptionStatus(subscriptionId: string, priceId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            subscriptionId: string;
            status: Stripe.Subscription.Status;
            plan: string | null;
            price: number;
            currency: string;
        };
    }>;
    handleDeleteSubscription(subscriptionId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            subscriptionId: string;
            status: Stripe.Subscription.Status;
            plan: string | null;
            price: number;
            currency: string;
        };
    }>;
    getUserSubscriptions(customerId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            status: Stripe.Subscription.Status;
            currentPeriodStart: Date;
            currentPeriodEnd: Date;
            cancelAtPeriodEnd: boolean;
            priceId: string;
            amount: number;
            currency: string;
            productId: string | Stripe.Product | Stripe.DeletedProduct;
            latestInvoiceId: string | Stripe.Invoice | null;
        }[];
    }>;
    payoutDrivers(): Promise<{
        success: boolean;
        message: string;
        statusCode: number;
        data: {
            driverId: any;
            message?: string;
            totalEarnings?: number;
            payoutMethod?: string;
            payoutAccount?: string;
            ridesPaid?: number;
            driverPayment?: any;
        }[];
    }>;
}
