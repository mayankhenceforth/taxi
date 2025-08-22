import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Model } from 'mongoose';
import { RideDocument } from '../schema/ride.schema';
import { InvoiceService } from '../invoice/invoice.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
export declare class PaymentService {
    private readonly configService;
    private readonly rideModel;
    private readonly invoiceService;
    private readonly cloudinaryService;
    private stripe;
    constructor(configService: ConfigService, rideModel: Model<RideDocument>, invoiceService: InvoiceService, cloudinaryService: CloudinaryService);
    createCheckoutSession(successUrl: string, cancelUrl: string, totalAmount: number, rideId: string): Promise<string | null>;
    handleWebhook(rawBody: Buffer, sig: string): Promise<{
        received: boolean;
    }>;
    handleRefund(paymentIntentId: string, rideId: string): Promise<{
        message: string;
        refundId: string;
        status: string | null;
        refundedAmount: number;
        refundPercentage: number;
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
}
