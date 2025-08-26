
import { HttpStatus, Injectable, BadRequestException, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ride, RideDocument } from '../schema/ride.schema';
import { InvoiceService } from '../invoice/invoice.service';
import * as fs from 'fs';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Payment, PaymentDocument } from '../schema/payment.schema';
import { DriverEarning, DriverEarningDocument } from '../schema/driver-earnings.schema';
import { DriverPayout, DriverPayoutDocument } from '../schema/payout.schema';
import { ApiResponse } from '@nestjs/swagger';
import { DriverPayment, DriverPaymentDocument } from '../schema/DriverPaymentInfo.schema';
import { privateEncrypt } from 'crypto';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Ride.name) private readonly rideModel: Model<RideDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(DriverPayout.name) private readonly driverPayoutModel: Model<DriverPayoutDocument>,
    @InjectModel(DriverEarning.name) private readonly driverEarningModel: Model<DriverEarningDocument>,
    @InjectModel(DriverPayment.name) private readonly driverPaymentModel:Model<DriverPaymentDocument>,
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
    // Validate inputs
    if (!rideId) throw new BadRequestException('rideId is required');
    if (totalAmount <= 0) throw new BadRequestException('totalAmount must be > 0');

    const amountInCents = Math.round(Number(totalAmount) * 100);

    const ride = await this.rideModel
      .findById(rideId)
      .populate('bookedBy driver')
      .lean();

    if (!ride) throw new HttpException('Ride not found', HttpStatus.NOT_FOUND);

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

    // Create Payment document with what we know now (PI may be null until completion)
    const payment = await this.paymentModel.create({
      userId: (ride as any).bookedBy?._id ?? (ride as any).bookedBy, // works if populated or raw ObjectId
      driverId: (ride as any).driver?._id ?? (ride as any).driver,
      rideId: new Types.ObjectId(rideId),
      amount: Number(totalAmount),
      currency: 'INR',
      status: 'unpaid',
      checkoutSessionId: session.id,
      paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
    });

    // Link the Payment to the Ride; set paymentStatus to pending
    await this.rideModel.findByIdAndUpdate(rideId, {
      checkoutSessionId: session.id,
      paymentId: payment._id,
      paymentStatus: 'pending',
    });

    return session.url!;
  }


  async handleWebhook(rawBody: Buffer, sig: string) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        sig,
        this.configService.get<string>('STRIPE_WEBHOOK_ENDPOINT_SECRET')!,
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err?.message);
      throw new BadRequestException(`Webhook error: ${err?.message}`);
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;

          // Expand payment_intent so we can store it reliably
          const fullSession = await this.stripe.checkout.sessions.retrieve(session.id, {
            expand: ['payment_intent'],
          });

          const rideId = fullSession.metadata?.rideId;
          const paymentIntent = fullSession.payment_intent as Stripe.PaymentIntent | null;

          if (!rideId) break;

          // Find ride and associated payment
          const ride = await this.rideModel.findById(rideId);
          if (!ride) break;

          const payment = await this.paymentModel.findOne({
            $or: [
              { _id: ride.paymentId },
              { checkoutSessionId: session.id },
            ],
          });

          // Update Payment doc
          if (payment) {
            payment.status = 'paid';
            if (paymentIntent?.id) payment.paymentIntentId = paymentIntent.id;
            await payment.save();
          }

          // Update Ride payment status & paidAt
          ride.paymentStatus = 'paid';
          ride.paidAt = new Date();
          await ride.save();

          // Generate invoice PDF -> upload -> save URL on Ride
          const pdfBuffer = await this.invoiceService.generateInvoice(rideId);
          const uploadResult = (await this.cloudinaryService.uploadFile({
            buffer: pdfBuffer,
            originalname: `invoice_${ride._id}.pdf`,
            mimetype: 'application/pdf',
          })) as any;

          await this.rideModel.findByIdAndUpdate(ride._id, {
            invoiceUrl: uploadResult?.secure_url,
          });

          break;
        }

        case 'payment_intent.succeeded': {
          // Optional: in case you also send PI webhooks
          // You can mark Payment as succeeded here as a fallback
          const pi = event.data.object as Stripe.PaymentIntent;
          await this.paymentModel.updateOne(
            { paymentIntentId: pi.id },
            { status: 'succeeded' },
          );
          break;
        }

        case 'payment_intent.payment_failed': {
          const pi = event.data.object as Stripe.PaymentIntent;
          await this.paymentModel.updateOne(
            { paymentIntentId: pi.id },
            { status: 'failed' },
          );
          // You might also want to mark the ride back to unpaid
          await this.rideModel.updateOne(
            { paymentId: { $exists: true } },
            { $set: { paymentStatus: 'unpaid' } },
          );
          break;
        }

        default:
          // No-op for other events
          break;
      }

      return { received: true };
    } catch (error: any) {
      console.error('Webhook handling error:', error?.message);
      throw new BadRequestException(`Webhook error: ${error?.message}`);
    }
  }


  async handleRefund(rideId: string) {
    const ride = await this.rideModel.findById(rideId);
    if (!ride) throw new HttpException('Ride not found', HttpStatus.NOT_FOUND);

    if (!ride.paymentId) {
      throw new BadRequestException('Payment intent ID is required for refund');
    }

    if (ride.status === 'started' || ride.status === 'completed') {
      throw new BadRequestException(
        'Refund not allowed once ride has started or completed',
      );
    }

    if (ride.paymentStatus === 'refunded' || ride.paymentStatus === 'partially_refunded') {
      throw new BadRequestException('Refund already processed for this ride');
    }

    const paymentInfo = await this.paymentModel.findById(ride.paymentId);
    if (!paymentInfo || !paymentInfo.paymentIntentId) {
      throw new BadRequestException('Payment information not found for this ride');
    }

    let refundAmount = 0;
    let refundPercentage = 0;
    let refundReason = '';
    let driverEarningPercentage = 0
    let driverEarningAmount = 0
    let plateformEarning = 0

    const now = new Date();
    const createdAt = new Date(ride.createdAt);
    const diffMinutes = Math.floor((now.getTime() - createdAt.getTime()) / 60000);

    if (ride.cancelledBy === 'Driver') {

      if (ride.status == "arrived") {
        refundPercentage = 80;
        driverEarningPercentage = 15
        refundReason = 'Driver Arrived the location and cencelled'
        let platformEarningsPerscentage = 100 - refundPercentage - driverEarningPercentage
        plateformEarning = (Number(ride.TotalFare) * platformEarningsPerscentage) / 100
        refundAmount = (Number(ride.TotalFare) * refundPercentage) / 100;
        driverEarningAmount = (Number(ride.TotalFare) * driverEarningPercentage) / 100
      } else {
        refundAmount = Number(ride.TotalFare);
        refundPercentage = 100;
        driverEarningPercentage = 0
        refundReason = 'Cancelled by Driver';
      }
    } else if (ride.cancelledBy === 'User') {
      if (diffMinutes <= 10) {
        refundPercentage = 85;
        driverEarningPercentage = 10
        refundReason = 'Cancelled by User within 10 min';
      } else if (diffMinutes <= 15) {
        refundPercentage = 80;
        driverEarningPercentage = 15
        refundReason = 'Cancelled by User within 15 min';
      } else if (diffMinutes <= 20) {
        refundPercentage = 75;
        driverEarningPercentage = 20
        refundReason = 'Cancelled by User within 20 min';
      } else {
        driverEarningPercentage = 40
        refundPercentage = 50;
        refundReason = 'Cancelled by User after 20 min';
      }

      let platformEarningsPerscentage = 100 - refundPercentage - driverEarningPercentage
      plateformEarning = (Number(ride.TotalFare) * platformEarningsPerscentage) / 100
      refundAmount = (Number(ride.TotalFare) * refundPercentage) / 100;
      driverEarningAmount = (Number(ride.TotalFare) * driverEarningPercentage) / 100
    } else {
      refundPercentage = 100;
      refundAmount = Number(ride.TotalFare);
      refundReason = 'Cancelled by System';
    }

    if (refundAmount <= 0) {
      paymentInfo.refundStatus = 'not_applicable';
      await paymentInfo.save();
      throw new BadRequestException('No refund applicable for this ride');
    }

    const refund = await this.stripe.refunds.create({
      payment_intent: paymentInfo.paymentIntentId,
      amount: Math.round(refundAmount * 100),
    });

    ride.paymentStatus = refundPercentage === 100 ? 'refunded' : 'partially_refunded';
    ride.refundedAt = new Date();
    await ride.save();
    paymentInfo.refundAmount = refundAmount;
    paymentInfo.refundPercentage = refundPercentage;
    paymentInfo.refundReason = refundReason;
    paymentInfo.refundStatus = 'processed';
    paymentInfo.refundId = refund.id;
    paymentInfo.status = ride.paymentStatus;
    await paymentInfo.save();

    return {
      message: 'Refund initiated successfully!',
      refundId: refund.id,
      status: refund.status,
      refundedAmount: refundAmount,
      refundPercentage,
      driverEarningAmount,
      driverEarningPercentage,
      plateformEarning
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


  async payoutDrivers() {
  const driverAggregates = await this.rideModel.aggregate([
    {
      $match: {
        status: { $in: ["completed", "cancelled"] },
        driverPaymentStatus: { $ne: "paid" }
      }
    },
    {
      $group: {
        _id: "$driver",
        totalEarnings: { $sum: "$driverEarnings" },
        rides: {
          $push: {
            rideId: "$_id",
            status: "$status",
            driverEarnings: "$driverEarnings",
            cancelledBy: "$cancelledBy"
          }
        }
      }
    }
  ]);

  const results: Array<{
    driverId: any;
    message?: string;
    totalEarnings?: number;
    payoutMethod?: string;
    payoutAccount?: string;
    ridesPaid?: number;
    driverPayment?: any;
  }> = [];

  for (const driver of driverAggregates) {
    if (!driver._id) continue;

    // 1️⃣ Get driver's default payout account
    const payoutDetails = await this.driverPayoutModel.findOne({
      driverId: driver._id,
      isActive: true,
      isDefault: true
    });

    if (!payoutDetails) {
      results.push({
        driverId: driver._id,
        message: "No payout details found, skipped",
        totalEarnings: driver.balance
      });
      continue;
    }

    // 2️⃣ Update driver earnings documents
    await this.driverEarningModel.updateMany(
      { driverId: driver._id, driverPaymentStatus: "unpaid" },
      { $set: { driverPaymentStatus: "paid", updatedAt: new Date() } }
    );

    // 3️⃣ Update ride documents
    await this.rideModel.updateMany(
      { _id: { $in: driver.rides.map((r: any) => r.rideId) } },
      { $set: { driverPaymentStatus: "paid" } }
    );

    // 4️⃣ Update or create DriverPayment document
    const driverPayment = await this.driverPaymentModel.findOneAndUpdate(
  { driverId: driver._id },
  {
    $set: {
      payoutMethod: payoutDetails._id,
      balance: 0,
      status: "paid",
      lastPayoutAmount: driver.totalEarnings,
      lastPayoutDate: new Date(),
      payoutTransactionId: new Types.ObjectId().toHexString(),
      remarks: "Payout processed successfully"
    },
    $inc: {
      totalEarnings: driver.totalEarnings // increment totalEarnings by current payout
    }
  },
  { upsert: true, new: true }
);

    // 5️⃣ Push summary
    results.push({
      driverId: driver._id,
      totalEarnings: driver.totalEarnings,
      payoutMethod: payoutDetails.method,
      payoutAccount: payoutDetails.accountNumber,
      ridesPaid: driver.rides.length,
      driverPayment
    });
  }

  return {
    success: true,
    message: "Driver payouts processed",
    statusCode: 200,
    data: results
  };
}




}