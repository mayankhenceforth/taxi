import { Controller, Get, Post, Body, Param, Req, UseGuards, BadRequestException, Patch, Res } from '@nestjs/common';
import { RideService } from './ride.service';
import { CreateRideDto } from './dto/create-ride.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/comman/decorator/role.decorator';
import { Role } from 'src/comman/enums/role.enum';
import { AuthGuards } from 'src/comman/guards/auth.guards';
import { RoleGuards } from 'src/comman/guards/role.guards';
import { VerifyRideOtpDto } from './dto/verify-ride-otp.dto';
import { cencelRideDto } from './dto/cencel-ride.dto';
import { Response } from 'express';
import { PaymentService } from 'src/comman/payment/payment.service';
import { InvoiceService } from 'src/comman/invoice/invoice.service';

@Controller('ride')
export class RideController {
  constructor(
    private readonly rideService: RideService,
    private readonly paymentService: PaymentService,
    private readonly invoiceService: InvoiceService,
  ) { }

  @Post()
  @ApiBearerAuth()
  @Roles(Role.User)
  @UseGuards(AuthGuards, RoleGuards)
  create(@Req() request: any, @Body() createRideDto: CreateRideDto) {
    return this.rideService.createRide(request, createRideDto);
  }

  @ApiBearerAuth()
  @Roles(Role.Driver)
  @UseGuards(AuthGuards, RoleGuards)
  @Get('accept/:rideId')
  handleAcceptRide(@Param('rideId') rideId: string, @Req() request: any) {
    return this.rideService.acceptRide(rideId, request);
  }

  @ApiBearerAuth()
  @Roles(Role.Driver)
  @UseGuards(AuthGuards, RoleGuards)
  @Patch('/:rideId/verify-otp')
  handleOtpRide(
    @Param('rideId') rideId: string,
    @Req() request: any,
    @Body() verifyRideOtpDto: VerifyRideOtpDto,
  ) {
    return this.rideService.verifyRideOtp(rideId, request, verifyRideOtpDto, Role.Driver);
  }

  @ApiBearerAuth()
  @Roles(Role.User, Role.Driver)
  @UseGuards(AuthGuards, RoleGuards)
  @Post(':rideId/cancel')
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

  @ApiBearerAuth()
  @Roles(Role.User)
  @UseGuards(AuthGuards, RoleGuards)
  @Get(':rideId/payment')
  async handlePaymentRide(
    @Param('rideId') rideId: string,
    @Req() request: any,
  ) {
    console.log("rideId:", rideId);
    console.log("request:", request.user);
    return this.rideService.paymentRide(rideId, request);
  }

  @ApiBearerAuth()
  @Roles(Role.User)
  @UseGuards(AuthGuards, RoleGuards)
  @Get(':rideId/confirm-payment')
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


}
