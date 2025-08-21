import { PaymentService } from './payment.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { RideDocument } from '../schema/ride.schema';
import { Model } from 'mongoose';
export declare class PaymentController {
    private readonly paymentService;
    private rideModel;
    private totalAmount;
    private rideId;
    constructor(paymentService: PaymentService, rideModel: Model<RideDocument>);
    handleCreatePaymentSession(): Promise<string | null>;
    handlePaymentSucess(): string;
    handlePaymentCancel(): string;
    handleWebhook(req: Request): Promise<{
        received: boolean;
    }>;
    handleRefund(intentId: string): void;
    handleCreateSubscription(createSubscriptionDto: CreateSubscriptionDto): Promise<{
        success: boolean;
        message: string;
        data: {
            subscriptionId: string;
            status: import("stripe").Stripe.Subscription.Status;
            plan: string | null;
            price: number;
            currency: string;
        };
    }>;
    handleCreateSubscriptionByCheckout(createSubscriptionDto: CreateSubscriptionDto): Promise<{
        success: boolean;
        message: string;
        data: {
            url: string | null;
            id: string;
        };
    }>;
    handleUpdateSubscription(updateSubscriptionDto: UpdateSubscriptionDto): Promise<{
        success: boolean;
        message: string;
        data: {
            subscriptionId: string;
            status: import("stripe").Stripe.Subscription.Status;
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
            status: import("stripe").Stripe.Subscription.Status;
            plan: string | null;
            price: number;
            currency: string;
        };
    }>;
    handleGetCustomerSubscriptions(customerId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            status: import("stripe").Stripe.Subscription.Status;
            currentPeriodStart: Date;
            currentPeriodEnd: Date;
            cancelAtPeriodEnd: boolean;
            priceId: string;
            amount: number;
            currency: string;
            productId: string | import("stripe").Stripe.Product | import("stripe").Stripe.DeletedProduct;
            latestInvoiceId: string | import("stripe").Stripe.Invoice | null;
        }[];
    }>;
}
