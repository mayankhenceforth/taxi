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
import { RideInvoiceService } from 'src/comman/Invoice/bill.ride';
import { Response } from 'express';

@Controller('ride')
export class RideController {
  constructor(private readonly rideService: RideService
              , private readonly RideInvoiceService: RideInvoiceService
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
  @Get("accept/:rideId")
  handleAcceptRide(@Param('rideId') rideId: string, @Req() request: any) {
    return this.rideService.acceptRide(rideId, request);
  }

  @ApiBearerAuth()
  @Roles(Role.Driver)
  @UseGuards(AuthGuards, RoleGuards)
  @Patch("/:rideId/verify-otp")
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
  @Post(":rideId/cancel")
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
  @Post(":rideId/payment")
  handlePaymentRide(@Param('rideId') rideId: string,
 @Req() request: any,){
    return this.rideService.paymentRide(rideId,request);
  }

  // @Get('static-invoice')
  // async getStaticInvoice(@Res() res: Response) {
  //   const pdfBuffer = await this.RideInvoiceService.generateInvoice();
  //   res.setHeader('Content-Type', 'application/pdf');
  //   res.setHeader('Content-Disposition', `attachment; filename=ride_invoice_demo.pdf`);
  //   res.send(pdfBuffer);
  // }


}
