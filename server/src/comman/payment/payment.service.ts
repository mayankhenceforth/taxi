// import { HttpStatus, Injectable, BadRequestException, HttpException } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import Stripe from 'stripe';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { Ride, RideDocument } from '../schema/ride.schema';
// import { InvoiceService } from '../invoice/invoice.service';
// import * as fs from 'fs';
// import { CloudinaryService } from '../cloudinary/cloudinary.service';
// import { Payment, PaymentDocument } from '../schema/payment.schema';

// @Injectable()
// export class PaymentService {
//   private stripe: Stripe;

// constructor(
//     private readonly configService: ConfigService,
//     @InjectModel(Ride.name) private readonly rideModel: Model<RideDocument>,
//     @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
//     private readonly invoiceService: InvoiceService,
//     private readonly cloudinaryService: CloudinaryService,
//   ) {
//     this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY')!, {});
//   }
// async createCheckoutSession(
//   successUrl: string,
//   cancelUrl: string,
//   rideId: string,
//   totalAmount: number,
// ): Promise<string> {
//   const amountInCents = Math.round(totalAmount);
  
//   const ride = await this.rideModel.findById(rideId);
//   if (!ride) throw new BadRequestException('Ride not found');
  
//   if (ride.paymentStatus === 'paid') {
//     throw new BadRequestException('Ride already paid');
//   }

//   const session = await this.stripe.checkout.sessions.create({
//     payment_method_types: ['card'],
//     line_items: [
//       {
//         price_data: {
//           currency: 'inr',
//           unit_amount: amountInCents,
//           product_data: { 
//             name: 'Ride Payment',
//             description: `Ride from ${ride.pickupLocation?.coordinates} to ${ride.dropoffLocation?.coordinates}`
//           },
//         },
//         quantity: 1,
//       },
//     ],
//     mode: 'payment',
//     success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
//     cancel_url: `${cancelUrl}?session_id={CHECKOUT_SESSION_ID}`,
//     metadata: { 
//       rideId,
//       userId: ride.bookedBy.toString(),
//       driverId: ride.driver?.toString() || '',
//     },
//   });

//   const payment = await this.paymentModel.create({
//     userId: ride.bookedBy,
//     driverId: ride.driver,
//     rideId: ride._id,
//     paymentStatus: 'pending', 
//     amount: totalAmount / 100,
//     checkoutSessionId: session.id,
//     paymentIntentId: session.payment_intent,
//   });

//   await this.rideModel.findByIdAndUpdate(rideId, { 
//     paymentId: payment._id,
//     paymentStatus: 'processing'
//   });

//   return session.url!;
// }

// async handleWebhook(rawBody: Buffer, sig: string) {
//   try {
//     const event = this.stripe.webhooks.constructEvent(
//       rawBody,
//       sig,
//       this.configService.get<string>('STRIPE_WEBHOOK_ENDPOINT_SECRET')!,
//     );

//     if (event.type === 'checkout.session.completed') {
//       const session = event.data.object as Stripe.Checkout.Session;
//       const fullSession = await this.stripe.checkout.sessions.retrieve(session.id, { 
//         expand: ['payment_intent'] 
//       });
      
//       const rideId = fullSession.metadata?.rideId;
//       const paymentIntent = fullSession.payment_intent as Stripe.PaymentIntent;

//       if (!rideId || !paymentIntent) {
//         console.log('Missing rideId or paymentIntent in webhook');
//         return { received: true };
//       }
//       const payment = await this.paymentModel.findOne({ 
//         checkoutSessionId: session.id 
//       });
      
//       if (!payment) {
//         console.log(`Payment not found for session: ${session.id}`);
//         return { received: true };
//       }

//       payment.status = 'paid';
//       payment.paymentIntentId = paymentIntent.id;
//       console.log(paymentIntent.id)
  
//       await payment.save();
//       const ride = await this.rideModel.findById(rideId);
//       if (ride) {
//         ride.paymentStatus = 'paid';
//         await ride.save();
//         try {
//           const pdfBuffer = await this.invoiceService.generateInvoice(rideId);
//           const uploadResult = await this.cloudinaryService.uploadFile({
//             buffer: pdfBuffer,
//             originalname: `invoice_${rideId}.pdf`,
//             mimetype: 'application/pdf',
//           });
 
//           if(!uploadResult){
//             throw new BadRequestException("invoice to uploaded the cloud")
//           }

//           ride.invoiceUrl = uploadResult.secure_url;
//           await ride.save();
//           console.log('Invoice uploaded successfully');
//         } catch (invoiceError) {
//           console.error('Failed to generate/upload invoice:', invoiceError);
//         }
//       }

//       console.log('Payment completed successfully for ride:', rideId);
//     }

//     return { received: true };
//   } catch (error) {
//     console.error('Webhook error:', error.message);
//     throw new BadRequestException(`Webhook error: ${error.message}`);
//   }
// }
//   /** Handle Refund */
//  async handleRefund(rideId: string) {
//     const ride = await this.rideModel.findById(rideId).populate('paymentId');
//     if (!ride) throw new HttpException('Ride not found', HttpStatus.NOT_FOUND);
//     if (!ride.paymentId) throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);

//     const payment = ride.paymentId as unknown as PaymentDocument;

//     if (!payment.paymentIntentId) throw new BadRequestException('Payment intent ID is required for refund');
//     if (ride.status === 'started' || ride.status === 'completed') throw new BadRequestException('Refund not allowed once ride has started or completed');

//     const createdAt = new Date(ride.createdAt);
//     const diffMinutes = Math.floor((Date.now() - createdAt.getTime()) / 60000);

//     let refundAmount = 0;
//     let refundPercentage = 0;
//     let refundReason = '';

//     if (ride.cancelledBy === 'Driver') {
//       refundAmount = ride.TotalFare;
//       refundPercentage = 100;
//       refundReason = 'Cancelled by Driver';
//     } else if (ride.cancelledBy === 'User') {
//       if (diffMinutes <= 10) { refundPercentage = 85; refundReason = 'Cancelled by User within 10 min'; }
//       else if (diffMinutes <= 15) { refundPercentage = 80; refundReason = 'Cancelled by User within 15 min'; }
//       else if (diffMinutes <= 20) { refundPercentage = 75; refundReason = 'Cancelled by User within 20 min'; }
//       else { refundPercentage = 0; refundReason = 'Cancelled by User after 20 min (No Refund)'; }

//       refundAmount = (ride.TotalFare * refundPercentage) / 100;
//     }

//     if (refundAmount <= 0) throw new BadRequestException('No refund applicable for this ride');

//     const refund = await this.stripe.refunds.create({
//       payment_intent: payment.paymentIntentId,
//       amount: Math.round(refundAmount * 100),
//     });

//     // Update payment
//     payment.refundStatus = 'processed';
//     payment.refundAmount = refundAmount;
//     payment.refundPercentage = refundPercentage;
//     payment.refundReason = refundReason;
//     payment.refundedAt = new Date();
//     await payment.save();

//     // Update ride
//     ride.paymentStatus = refundPercentage === 100 ? 'refunded' : 'partially_refunded';
//     await ride.save();

//     return {
//       message: 'Refund initiated successfully!',
//       refundId: refund.id,
//       status: refund.status,
//       refundedAmount: refundAmount,
//       refundPercentage,
//     };
//   }

//   /** Create Customer */
//   async createCustomer(email: string, paymentMethodId: string) {
//     const customer = await this.stripe.customers.create({
//       email,
//       payment_method: paymentMethodId,
//       invoice_settings: { default_payment_method: paymentMethodId },
//     });
//     return {
//       success: true,
//       message: 'Customer created successfully',
//       data: { id: customer.id, email: customer.email },
//     };
//   }

//   /** Create Subscription */
//   async createSubscription(customerId: string, priceId: string) {
//     const subscription = await this.stripe.subscriptions.create({
//       customer: customerId,
//       items: [{ price: priceId }],
//     });

//     return {
//       success: true,
//       message: 'Subscription created successfully',
//       data: {
//         subscriptionId: subscription.id,
//         status: subscription.status,
//         plan: subscription.items.data[0].price.nickname,
//         price: subscription.items.data[0].price.unit_amount! / 100,
//         currency: subscription.items.data[0].price.currency,
//       },
//     };
//   }

//   /** Create Subscription with Checkout */
//   async createSubscriptionWithCheckout(
//     priceId: string,
//     customerId: string,
//     successUrl: string,
//     cancelUrl: string,
//   ) {
//     const session = await this.stripe.checkout.sessions.create({
//       mode: 'subscription',
//       customer: customerId,
//       line_items: [{ price: priceId, quantity: 1 }],
//       submit_type: 'subscribe',
//       success_url: successUrl,
//       cancel_url: cancelUrl,
//     });

//     return {
//       success: true,
//       message: 'Subscription checkout created successfully',
//       data: { url: session.url, id: session.id },
//     };
//   }

//   /** Update Subscription */
//   async handleUpdateSubscriptionStatus(subscriptionId: string, priceId: string) {
//     const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
//     const subscriptionItemId = subscription.items.data[0].id;

//     const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
//       items: [{ id: subscriptionItemId, price: priceId }],
//       proration_behavior: 'create_prorations',
//     });

//     return {
//       success: true,
//       message: 'Subscription updated successfully',
//       data: {
//         subscriptionId: updatedSubscription.id,
//         status: updatedSubscription.status,
//         plan: updatedSubscription.items.data[0].price.nickname,
//         price: updatedSubscription.items.data[0].price.unit_amount! / 100,
//         currency: updatedSubscription.items.data[0].price.currency,
//       },
//     };
//   }

//   /** Delete Subscription */
//   async handleDeleteSubscription(subscriptionId: string) {
//     const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
//     return {
//       success: true,
//       message: 'Subscription canceled successfully',
//       data: {
//         subscriptionId: subscription.id,
//         status: subscription.status,
//         plan: subscription.items.data[0].price.nickname,
//         price: subscription.items.data[0].price.unit_amount! / 100,
//         currency: subscription.items.data[0].price.currency,
//       },
//     };
//   }

//   /** Get User Subscriptions */
//   async getUserSubscriptions(customerId: string) {
//     const subscriptions = await this.stripe.subscriptions.list({
//       customer: customerId,
//       status: 'active',
//       expand: ['data.default_payment_method', 'data.items.data.price'],
//     });

//     const data = subscriptions.data.map(sub => ({
//       id: sub.id,
//       status: sub.status,
//       currentPeriodStart: new Date(sub.items.data[0]?.current_period_start! * 1000),
//       currentPeriodEnd: new Date(sub.items.data[0]?.current_period_end! * 1000),
//       cancelAtPeriodEnd: sub.cancel_at_period_end,
//       priceId: sub.items.data[0].price.id,
//       amount: sub.items.data[0].price.unit_amount! / 100,
//       currency: sub.items.data[0].price.currency,
//       productId: sub.items.data[0].price.product,
//       latestInvoiceId: sub.latest_invoice,
//     }));

//     return { success: true, message: 'User subscriptions fetched', data };
//   }
// }




import { HttpStatus, Injectable, BadRequestException, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ride, RideDocument } from '../schema/ride.schema';
import { InvoiceService } from '../invoice/invoice.service';
import * as fs from 'fs';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Ride.name) private readonly rideModel: Model<RideDocument>,
    private readonly invoiceService: InvoiceService,
    private readonly cloudinaryService: CloudinaryService,
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
    const amountInCents = Math.round(totalAmount);
    const session = await this.stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'inr',
            unit_amount: amountInCents,
            product_data: { name: 'Ride Payment' },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { rideId },
    });

    // store only session id
    await this.rideModel.findByIdAndUpdate(rideId, {
      checkoutSessionId: session.id,
    });

    return session.url;


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

          // expand payment intent
          const fullSession = await this.stripe.checkout.sessions.retrieve(session.id, {
            expand: ['payment_intent'],
          });

          const rideId = fullSession.metadata?.rideId;
          const paymentIntent = fullSession.payment_intent as Stripe.PaymentIntent;

          if (rideId && paymentIntent) {
            await this.rideModel.findByIdAndUpdate(rideId, {
              paymentStatus: 'paid',
              paymentIntentId: paymentIntent.id,   // ✅ stored correctly now
            });

            // generate and upload invoice as you already do
            const pdfBuffer = await this.invoiceService.generateInvoice(rideId);
            const uploadResult = await this.cloudinaryService.uploadFile({
              buffer: pdfBuffer,
              originalname: `invoice_${rideId}.pdf`,
              mimetype: 'application/pdf',
            }) as any;

            await this.rideModel.findByIdAndUpdate(rideId, {
              invoiceUrl: uploadResult.secure_url,
            });
          }
          break;
        }


        // ... rest of the webhook handling code
      }

      return { received: true };
    } catch (error) {
      console.error('Webhook error:', error.message);
      throw new BadRequestException(`Webhook error: ${error.message}`);
    }
  }

  async handleRefund(rideId: string) {
    const ride = await this.rideModel.findById(rideId).populate("paymentId");

    if (!ride) {
      throw new HttpException('Ride not found', HttpStatus.NOT_FOUND);
    }

    if (!ride.paymentId) {
      throw new BadRequestException('Payment intent ID is required for refund');
    }

    if (ride.status === 'started' || ride.status === 'completed') {
      console.log("Ride has started or completed, refund not allowed");
      throw new BadRequestException('Refund not allowed once ride has started or completed');
    }

    let refundAmount = 0;
    let refundPercentage = 0;
    let refundReason = '';

    const now = new Date();
    const createdAt = new Date(ride.createdAt);
    const diffMinutes = Math.floor((now.getTime() - createdAt.getTime()) / 60000);

    if (ride.cancelledBy === 'Driver') {
      refundAmount = ride.TotalFare;
      refundPercentage = 100;
      refundReason = 'Cancelled by Driver';


    } else if (ride.cancelledBy === 'User') {
      if (diffMinutes <= 10) {
        refundPercentage = 85;
        refundReason = 'Cancelled by User within 10 min';
     
      } else if (diffMinutes <= 15) {
        refundPercentage = 80;
        refundReason = 'Cancelled by User within 15 min';
      } else if (diffMinutes <= 20) {
        refundPercentage = 75;
        refundReason = 'Cancelled by User within 20 min';
      } else {
        refundPercentage = 0;
        refundReason = 'Cancelled by User after 20 min (No Refund)';
      }
      refundAmount = (ride.TotalFare * refundPercentage) / 100;
    }

    if (refundAmount <= 0) {
      throw new BadRequestException('No refund applicable for this ride');
    }

    console.log("Full refund applicable as ride was cancelled by Driver");
    console.log("Refund Amount:", refundAmount);
    console.log("Refund Percentage:", refundPercentage);
    console.log("Refund Reason:", refundReason);

   
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: Math.round(refundAmount * 100),
    });

    ride.paymentStatus = refundPercentage === 100 ? 'refunded' : 'partially_refunded';
    

    await ride.save();

    return {
      message: 'Refund initiated successfully!',
      refundId: refund.id,
      status: refund.status,
      refundedAmount: refundAmount,
      refundPercentage,
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