import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  BadRequestException,
  Patch,
  Res,
} from '@nestjs/common';
import { RideService } from './ride.service';
import { CreateRideDto } from './dto/create-ride.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Roles } from 'src/comman/decorator/role.decorator';
import { Role } from 'src/comman/enums/role.enum';
import { AuthGuards } from 'src/comman/guards/auth.guards';
import { RoleGuards } from 'src/comman/guards/role.guards';
import { VerifyRideOtpDto } from './dto/verify-ride-otp.dto';
import { cencelRideDto } from './dto/cencel-ride.dto';
import { Response } from 'express';
import { PaymentService } from 'src/comman/payment/payment.service';
import { InvoiceService } from 'src/comman/invoice/invoice.service';
import { RideRatingDto } from './dto/rating.dto';

@ApiTags('Ride')
@Controller('ride')
export class RideController {
  constructor(
    private readonly rideService: RideService,
    private readonly paymentService: PaymentService,
    private readonly invoiceService: InvoiceService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @Roles(Role.User)
  @UseGuards(AuthGuards, RoleGuards)
  @ApiOperation({
    summary: 'Create a new ride',
    description: 'Allows a user to create a new ride request.',
  })
  @ApiResponse({ status: 201, description: 'Ride created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid ride details.' })
  @ApiResponse({ status: 401, description: 'Unauthorized access.' })
  @ApiResponse({ status: 403, description: 'User role required.' })
  create(@Req() request: any, @Body() createRideDto: CreateRideDto) {
    return this.rideService.createRide(request, createRideDto);
  }

  @Get('accept/:rideId')
  @ApiBearerAuth()
  @Roles(Role.Driver)
  @UseGuards(AuthGuards, RoleGuards)
  @ApiOperation({
    summary: 'Accept a ride',
    description: 'Allows a driver to accept a ride request.',
  })
  @ApiParam({ name: 'rideId', type: String, description: 'Ride ID' })
  @ApiResponse({ status: 200, description: 'Ride accepted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized access.' })
  @ApiResponse({ status: 403, description: 'Driver role required.' })
  @ApiResponse({ status: 404, description: 'Ride not found.' })
  handleAcceptRide(@Param('rideId') rideId: string, @Req() request: any) {
    return this.rideService.acceptRide(rideId, request);
  }

  @Post(':rideId/cancel')
  @ApiBearerAuth()
  @Roles(Role.User, Role.Driver)
  @UseGuards(AuthGuards, RoleGuards)
  @ApiOperation({
    summary: 'Cancel a ride',
    description: 'Allows a user or driver to cancel a ride with a reason.',
  })
  @ApiParam({ name: 'rideId', type: String, description: 'Ride ID' })
  @ApiResponse({ status: 200, description: 'Ride cancelled successfully.' })
  @ApiResponse({ status: 400, description: 'Cancellation reason is required.' })
  @ApiResponse({ status: 401, description: 'Unauthorized access.' })
  @ApiResponse({ status: 403, description: 'User or Driver role required.' })
  @ApiResponse({ status: 404, description: 'Ride not found.' })
  @ApiBody({ type: cencelRideDto })
  handleCancelRide(
    @Param('rideId') rideId: string,
    @Req() request: any,
    @Body() cancelRideDto: cencelRideDto,
  ) {
    if (!cancelRideDto.reason || cancelRideDto.reason.trim() === '') {
      throw new BadRequestException('Cancellation reason is required');
    }
    return this.rideService.cencelRide(rideId, request, cancelRideDto.reason);
  }

  @Get(':rideId/arrive')
  @ApiBearerAuth()
  @Roles(Role.Driver)
  @UseGuards(AuthGuards, RoleGuards)
  @ApiOperation({
    summary: 'Driver marks arrival',
    description:
      'Allows a driver to mark that they have arrived at the pickup location.',
  })
  @ApiParam({ name: 'rideId', type: String, description: 'Ride ID' })
  @ApiResponse({
    status: 200,
    description: 'Driver marked as arrived successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access.' })
  @ApiResponse({ status: 403, description: 'Driver role required.' })
  @ApiResponse({ status: 404, description: 'Ride not found.' })
  handleDriverArrive(@Param('rideId') rideId: string, @Req() request: any) {
    return this.rideService.driverArrive(rideId, request);
  }

  @Patch('/:rideId/verify-otp')
  @ApiBearerAuth()
  @Roles(Role.Driver)
  @UseGuards(AuthGuards, RoleGuards)
  @ApiOperation({
    summary: 'Verify ride OTP',
    description: 'Verifies the ride using the provided OTP by the driver.',
  })
  @ApiParam({ name: 'rideId', type: String, description: 'Ride ID' })
  @ApiResponse({ status: 200, description: 'Ride OTP verified successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid OTP.' })
  @ApiResponse({ status: 401, description: 'Unauthorized access.' })
  @ApiResponse({ status: 403, description: 'Driver role required.' })
  @ApiResponse({ status: 404, description: 'Ride not found.' })
  handleOtpRide(
    @Param('rideId') rideId: string,
    @Req() request: any,
    @Body() verifyRideOtpDto: VerifyRideOtpDto,
  ) {
    return this.rideService.verifyRideOtp(
      rideId,
      request,
      verifyRideOtpDto,
      Role.Driver,
    );
  }

  @Get(':rideId/payment')
  @ApiBearerAuth()
  @Roles(Role.User)
  @UseGuards(AuthGuards, RoleGuards)
  @ApiOperation({
    summary: 'Initiate ride payment',
    description: 'Initiates the payment process for a ride.',
  })
  @ApiParam({ name: 'rideId', type: String, description: 'Ride ID' })
  @ApiResponse({ status: 200, description: 'Payment initiated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized access.' })
  @ApiResponse({ status: 403, description: 'User role required.' })
  @ApiResponse({ status: 404, description: 'Ride not found.' })
  async handlePaymentRide(
    @Param('rideId') rideId: string,
    @Req() request: any,
  ) {
    return this.rideService.paymentRide(rideId, request);
  }

  @Get(':rideId/confirm-payment')
  @ApiBearerAuth()
  @Roles(Role.User)
  @UseGuards(AuthGuards, RoleGuards)
  @ApiOperation({
    summary: 'Confirm ride payment and download invoice',
    description: 'Confirms the payment for a ride and returns a PDF invoice.',
  })
  @ApiParam({ name: 'rideId', type: String, description: 'Ride ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment confirmed, invoice PDF returned.',
    content: { 'application/pdf': {} },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access.' })
  @ApiResponse({ status: 403, description: 'User role required.' })
  @ApiResponse({ status: 404, description: 'Ride not found.' })
  async confirmRidePayment(
    @Param('rideId') rideId: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.rideService.confirmPayment(rideId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice-${rideId}.pdf`,
    );
    res.end(pdfBuffer);
  }

  @Get(':rideId/complete')
  @ApiBearerAuth()
  @Roles(Role.Driver)
  @UseGuards(AuthGuards, RoleGuards)
  @ApiOperation({
    summary: 'Complete a ride',
    description: 'Marks a ride as completed for the user.',
  })
  @ApiParam({ name: 'rideId', type: String, description: 'Ride ID' })
  @ApiResponse({ status: 200, description: 'Ride marked as completed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized access.' })
  @ApiResponse({ status: 403, description: 'User role required.' })
  @ApiResponse({ status: 404, description: 'Ride not found.' })
  async handlePaymentcomplete(
    @Param('rideId') rideId: string,
    @Req() request: any,
  ) {
    return this.rideService.rideComplete(rideId, request);
  }

  @Post(":rideId/rating")
  @ApiBearerAuth()
  @Roles(Role.User)
  @UseGuards(AuthGuards,RoleGuards)
   @ApiParam({ name: 'rideId', type: String, description: 'Ride ID' })
   async handleRideRating(
     @Param('rideId') rideId: string,
    @Req() request: any,
    @Body() ratingDto:RideRatingDto
   ){
      return this.rideService.rideRating(rideId ,request , ratingDto)
   }


}
