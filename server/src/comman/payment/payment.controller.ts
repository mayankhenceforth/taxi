import { Controller, Get, Post, Param, Delete, Req, Headers, RawBodyRequest, Body, Put, Res, BadRequestException, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Ride, RideDocument } from '../schema/ride.schema';
import { Model } from 'mongoose';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBody, ApiHeader, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request, Response } from 'express';

@Controller('stripe')
@ApiTags('Stripe Payment Processing')
@ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
@ApiResponse({ status: 500, description: 'Internal Server Error - Payment gateway issue' })
export class PaymentController {
  private totalAmount: number;
  private rideId: string;
  
  constructor(
    private readonly paymentService: PaymentService,
    @InjectModel(Ride.name) private rideModel: Model<RideDocument>,
  ) { }

  @Get("create-checkout-session")
  @ApiOperation({ 
    summary: 'Create checkout session', 
    description: 'Create a Stripe checkout session for payment processing. Returns a session ID for client-side redirection.' 
  })
  @ApiQuery({ 
    name: 'amount', 
    required: false, 
    type: Number, 
    description: 'Payment amount in smallest currency unit (e.g., cents for USD)' 
  })
  @ApiQuery({ 
    name: 'rideId', 
    required: false, 
    type: String, 
    description: 'Ride ID associated with this payment' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Checkout session created successfully',
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', example: 'cs_test_abc123' },
        url: { type: 'string', example: 'https://checkout.stripe.com/c/pay/cs_test_abc123' }
      }
    }
  })
  handleCreatePaymentSession(
    @Query('amount') amount?: number,
    @Query('rideId') rideId?: string
  ) {
    const paymentAmount = amount || this.totalAmount;
    const associatedRideId = rideId || this.rideId;
    
    return this.paymentService.createCheckoutSession(
      "http://localhost:3000/stripe/success",
      "http://localhost:3000/stripe/cancel",
      paymentAmount,
      associatedRideId
    );
  }

  @Get("success")
  @ApiOperation({ 
    summary: 'Payment success page', 
    description: 'Redirect endpoint for successful payments. Displays confirmation message to users.' 
  })
  @ApiResponse({ status: 200, description: 'Payment success page rendered' })
  handlePaymentSuccess() {
    return "Thank you for your payment. Your ride has been confirmed!";
  }

  @Get("cancel")
  @ApiOperation({ 
    summary: 'Payment cancellation page', 
    description: 'Redirect endpoint for cancelled payments. Allows users to retry payment.' 
  })
  @ApiResponse({ status: 200, description: 'Payment cancellation page rendered' })
  handlePaymentCancel() {
    return "Payment was cancelled. You can try again if you still want to confirm your ride.";
  }

  @Post('webhook')
  @ApiOperation({ 
    summary: 'Stripe webhook handler', 
    description: 'Endpoint for Stripe webhook events. Handles payment events like successful charges, refunds, etc.' 
  })
  @ApiHeader({
    name: 'stripe-signature',
    description: 'Stripe signature header for webhook verification',
    required: true
  })
  @ApiBody({
    description: 'Raw webhook event data from Stripe',
    required: true
  })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') sig: string
  ) {
    try {
      await this.paymentService.handleWebhook(req.body as unknown as Buffer, sig);
      return { received: true, message: 'Webhook processed successfully' };
    } catch (err: any) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
  }

  @Delete("refund/:intentId/:rideId")
  @ApiOperation({ 
    summary: 'Process payment refund', 
    description: 'Initiate a refund for a specific payment intent. Requires payment intent ID and associated ride ID.' 
  })
  @ApiParam({ 
    name: 'intentId', 
    type: String, 
    description: 'Stripe Payment Intent ID to refund' 
  })
  @ApiParam({ 
    name: 'rideId', 
    type: String, 
    description: 'Ride ID associated with the payment' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Refund processed successfully',
    schema: {
      type: 'object',
      properties: {
        refundId: { type: 'string', example: 're_abc123' },
        status: { type: 'string', example: 'succeeded' },
        amount: { type: 'number', example: 2500 }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Payment intent or ride not found' })
  async handleRefund(
    @Param("intentId") intentId: string,
    @Param("rideId") rideId: string,
  ) {
    return this.paymentService.handleRefund(intentId, rideId);
  }

  @Post("create-subscription")
  @ApiOperation({ 
    summary: 'Create subscription', 
    description: 'Create a new subscription for a customer using price ID. For recurring payments.' 
  })
  @ApiBody({ type: CreateSubscriptionDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Subscription created successfully',
    schema: {
      type: 'object',
      properties: {
        subscriptionId: { type: 'string', example: 'sub_abc123' },
        status: { type: 'string', example: 'active' }
      }
    }
  })
  handleCreateSubscription(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.paymentService.createSubscription(createSubscriptionDto.customerId, createSubscriptionDto.priceId);
  }

  @Post("create-subscription-by-checkout")
  @ApiOperation({ 
    summary: 'Create subscription via checkout', 
    description: 'Create a subscription using Stripe Checkout for better user experience.' 
  })
  @ApiBody({ type: CreateSubscriptionDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Checkout session created for subscription',
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', example: 'cs_test_abc123' },
        url: { type: 'string', example: 'https://checkout.stripe.com/c/pay/cs_test_abc123' }
      }
    }
  })
  handleCreateSubscriptionByCheckout(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.paymentService.createSubscriptionWithCheckout(
      createSubscriptionDto.priceId,
      createSubscriptionDto.customerId,
      "http://localhost:3000/stripe/success",
      "http://localhost:3000/stripe/cancel"
    );
  }

  @Put("update-subscription")
  @ApiOperation({ 
    summary: 'Update subscription', 
    description: 'Update an existing subscription (e.g., change plan, update payment method).' 
  })
  @ApiBody({ type: UpdateSubscriptionDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Subscription updated successfully',
    schema: {
      type: 'object',
      properties: {
        subscriptionId: { type: 'string', example: 'sub_abc123' },
        status: { type: 'string', example: 'active' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  handleUpdateSubscription(@Body() updateSubscriptionDto: UpdateSubscriptionDto) {
    return this.paymentService.handleUpdateSubscriptionStatus(updateSubscriptionDto.subscriptionId, updateSubscriptionDto.priceId);
  }

  @Delete("delete-subscription/:subscriptionId")
  @ApiOperation({ 
    summary: 'Cancel subscription', 
    description: 'Cancel an existing subscription. The subscription will remain active until the end of the current billing period.' 
  })
  @ApiParam({ 
    name: 'subscriptionId', 
    type: String, 
    description: 'Stripe Subscription ID to cancel' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Subscription cancelled successfully',
    schema: {
      type: 'object',
      properties: {
        subscriptionId: { type: 'string', example: 'sub_abc123' },
        status: { type: 'string', example: 'canceled' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  handleDeleteSubscription(@Param('subscriptionId') subscriptionId: string) {
    return this.paymentService.handleDeleteSubscription(subscriptionId);
  }

  @Get("customer-subscriptions/:customerId")
  @ApiOperation({ 
    summary: 'Get customer subscriptions', 
    description: 'Retrieve all active subscriptions for a specific customer.' 
  })
  @ApiParam({ 
    name: 'customerId', 
    type: String, 
    description: 'Stripe Customer ID' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Subscriptions retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          status: { type: 'string' },
          currentPeriodStart: { type: 'number' },
          currentPeriodEnd: { type: 'number' },
          plan: { type: 'object' }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  handleGetCustomerSubscriptions(@Param('customerId') customerId: string) {
    return this.paymentService.getUserSubscriptions(customerId);
  }

  // Commented out endpoints with documentation in case you want to enable them later
  /*
  @Get("subscriptions-data")
  @ApiOperation({ 
    summary: 'Get all subscriptions data', 
    description: 'Retrieve data for all subscriptions in the system. Requires admin privileges.' 
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Subscriptions data retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  handleGetSubscriptionsData() {
    return this.paymentService.getAllSubscriptions();
  }

  @Post("create-customer")
  @ApiOperation({ 
    summary: 'Create customer', 
    description: 'Create a new Stripe customer for payment processing.' 
  })
  @ApiBody({ type: CreateCustomerDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Customer created successfully',
    schema: {
      type: 'object',
      properties: {
        customerId: { type: 'string', example: 'cus_abc123' }
      }
    }
  })
  handleCreateCustomer(@Body() createCustomerDto: CreateCustomerDto) {
    return this.paymentService.createCustomer(createCustomerDto);
  }
  */
}