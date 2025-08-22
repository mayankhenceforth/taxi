import { Controller, Get, Post, Param, Delete, Req, Headers, RawBodyRequest, Body, Put, Res, BadRequestException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Ride, RideDocument } from '../schema/ride.schema';
import { Model } from 'mongoose';

@Controller('stripe')
export class PaymentController {
  private totalAmount: number;
  private rideId: string;
  constructor(
    private readonly paymentService: PaymentService,
    @InjectModel(Ride.name) private rideModel: Model<RideDocument>,
  ) { }

  @Get("create-checkout-session")
  handleCreatePaymentSession() {
    return this.paymentService.createCheckoutSession(
      "http://localhost:3000/stripe/success",
      "http://localhost:3000/stripe/cancel",
      this.totalAmount,
      this.rideId
    );
  }

  @Get("success")
  handlePaymentSucess() {
    return "Thank you for placing order..."
  }

  @Get("cancel")
  handlePaymentCancel() {
    return "Forgot to add something in cart? Add and come back to place order..."
  }

  @Post('webhook')
  async handleWebhook(@Req() req: Request) {

    const sig = req.headers['stripe-signature'] as string;
  
    try {
      await this.paymentService.handleWebhook(req.body as unknown as Buffer, sig);
      return { received: true };
    } catch (err: any) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
  }


 @Delete("refund/:intentId/:rideId")
async handleRefund(
  @Param("intentId") intentId: string,
  @Param("rideId") rideId: string,
) {
  return this.paymentService.handleRefund(intentId, rideId);
}
  // @Get("subscriptions-data")
  // handleGetSubscriptionsData() {
  //   return this.paymentService.getAllSubscriptions();
  // }

  // @Post("create-customer")
  // handleCreateCustomer(@Body() createCustomerDto: CreateCustomerDto) {
  //   return this.paymentService.createCustomer(createCustomerDto);
  // }

  @Post("create-subscription")
  handleCreateSubscription(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.paymentService.createSubscription(createSubscriptionDto.customerId, createSubscriptionDto.priceId);
  }

  @Post("create-subscription-by-checkout")
  handleCreateSubscriptionByCheckout(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.paymentService.createSubscriptionWithCheckout(
      createSubscriptionDto.priceId,
      createSubscriptionDto.customerId,
      "http://localhost:3000/stripe/success",
      "http://localhost:3000/stripe/cancel"
    );
  }

  @Put("update-subscription")
  handleUpdateSubscription(@Body() updateSubscriptionDto: UpdateSubscriptionDto) {
    return this.paymentService.handleUpdateSubscriptionStatus(updateSubscriptionDto.subscriptionId, updateSubscriptionDto.priceId);
  }

  @Delete("delete-subscription/:subscriptionId")
  handleDeleteSubscription(@Param('subscriptionId') subscriptionId: string) {
    return this.paymentService.handleDeleteSubscription(subscriptionId);
  }

  @Get("customer-subscriptions/:customerId")
  handleGetCustomerSubscriptions(@Param('customerId') customerId: string) {
    return this.paymentService.getUserSubscriptions(customerId);
  }

}
