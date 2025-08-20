import { HttpStatus, Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ride, RideDocument } from '../schema/ride.schema';
import { InvoiceService } from '../invoice/invoice.service';
import * as fs from 'fs';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Ride.name) private readonly rideModel: Model<RideDocument>,
    private readonly invoiceService: InvoiceService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY')!, {
   
    });
  }
  async createCheckoutSession(
    successUrl: string,
    cancelUrl: string,
    totalAmount: number,
    rideId: string,
  ) {
    const amountInCents = Math.round(totalAmount );
    const session = await this.stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'inr',
            unit_amount: amountInCents,
            product_data: {
              name: 'Ride Payment',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { rideId },
    });

    return session.url;
  }

  async handleWebhook(rawBody: Buffer, sig: string) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        sig,
        this.configService.get<string>('STRIPE_WEBHOOK_ENDPOINT_SECRET')!,
      );

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const rideId = session.metadata?.rideId;
          if (rideId) {
            await this.rideModel.findByIdAndUpdate(rideId, { paymentStatus: 'paid' });

            
            const pdfBuffer = await this.invoiceService.generateInvoice(rideId);

            const invoicePath = `invoices/invoice_${rideId}.pdf`;
            fs.writeFileSync(invoicePath, pdfBuffer);
            console.log(`✅ Invoice generated for Ride ${rideId}`);
          }
          break;
        }

        case 'payment_intent.payment_failed': {
          const intent = event.data.object as Stripe.PaymentIntent;
          const rideId = intent.metadata?.rideId;
          if (rideId) {
            await this.rideModel.findByIdAndUpdate(rideId, { paymentStatus: 'unpaid' });
          }
          break;
        }

        case 'charge.refunded': {
          const charge = event.data.object as Stripe.Charge;
          const rideId = charge.metadata?.rideId;
          if (rideId) {
            await this.rideModel.findByIdAndUpdate(rideId, { refundStatus: 'processed' });
          }
          break;
        }
      }

      return { received: true };
    } catch (error) {
      console.error('Webhook error:', error.message);
      throw new BadRequestException(`Webhook error: ${error.message}`);
    }
  }

  /** Handle Refund */
  async handleRefund(paymentIntentId: string) {
    const refund = await this.stripe.refunds.create({ payment_intent: paymentIntentId });
    return {
      message: 'Refund initiated successfully!',
      refundId: refund.id,
      status: refund.status,
    };
  }

  /** Create Customer */
  async createCustomer(email: string, paymentMethodId: string) {
    const customer = await this.stripe.customers.create({
      email,
      payment_method: paymentMethodId,
      invoice_settings: { default_payment_method: paymentMethodId },
    });
    return {
      success: true,
      message: 'Customer created successfully',
      data: { id: customer.id, email: customer.email },
    };
  }

  /** Create Subscription */
  async createSubscription(customerId: string, priceId: string) {
    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
    });

    return {
      success: true,
      message: 'Subscription created successfully',
      data: {
        subscriptionId: subscription.id,
        status: subscription.status,
        plan: subscription.items.data[0].price.nickname,
        price: subscription.items.data[0].price.unit_amount! / 100,
        currency: subscription.items.data[0].price.currency,
      },
    };
  }

  /** Create Subscription with Checkout */
  async createSubscriptionWithCheckout(
    priceId: string,
    customerId: string,
    successUrl: string,
    cancelUrl: string,
  ) {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      submit_type: 'subscribe',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return {
      success: true,
      message: 'Subscription checkout created successfully',
      data: { url: session.url, id: session.id },
    };
  }

  /** Update Subscription */
  async handleUpdateSubscriptionStatus(subscriptionId: string, priceId: string) {
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    const subscriptionItemId = subscription.items.data[0].id;

    const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
      items: [{ id: subscriptionItemId, price: priceId }],
      proration_behavior: 'create_prorations',
    });

    return {
      success: true,
      message: 'Subscription updated successfully',
      data: {
        subscriptionId: updatedSubscription.id,
        status: updatedSubscription.status,
        plan: updatedSubscription.items.data[0].price.nickname,
        price: updatedSubscription.items.data[0].price.unit_amount! / 100,
        currency: updatedSubscription.items.data[0].price.currency,
      },
    };
  }

  /** Delete Subscription */
  async handleDeleteSubscription(subscriptionId: string) {
    const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
    return {
      success: true,
      message: 'Subscription canceled successfully',
      data: {
        subscriptionId: subscription.id,
        status: subscription.status,
        plan: subscription.items.data[0].price.nickname,
        price: subscription.items.data[0].price.unit_amount! / 100,
        currency: subscription.items.data[0].price.currency,
      },
    };
  }

  /** Get User Subscriptions */
  async getUserSubscriptions(customerId: string) {
    const subscriptions = await this.stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      expand: ['data.default_payment_method', 'data.items.data.price'],
    });

    const data = subscriptions.data.map(sub => ({
      id: sub.id,
      status: sub.status,
      currentPeriodStart: new Date(sub.items.data[0]?.current_period_start! * 1000),
      currentPeriodEnd: new Date(sub.items.data[0]?.current_period_end! * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      priceId: sub.items.data[0].price.id,
      amount: sub.items.data[0].price.unit_amount! / 100,
      currency: sub.items.data[0].price.currency,
      productId: sub.items.data[0].price.product,
      latestInvoiceId: sub.latest_invoice,
    }));

    return { success: true, message: 'User subscriptions fetched', data };
  }
}
