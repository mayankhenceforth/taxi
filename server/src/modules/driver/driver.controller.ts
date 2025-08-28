import { Controller, Post, Body, UseGuards, Req, Get, Query, Param, BadRequestException } from '@nestjs/common';
import { DriverService } from './driver.service';
import { SetupDriverAccountDto } from './dto/SetupDriverAccount.dto';
import { CreateDriverPayoutDto } from './dto/CreatePaymentAccount.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AuthGuards } from 'src/comman/guards/auth.guards';
import { RoleGuards } from 'src/comman/guards/role.guards';
import { Roles } from 'src/comman/decorator/role.decorator';
import { Role } from 'src/comman/enums/role.enum';
import { InjectModel } from '@nestjs/mongoose';
import { Ride, RideDocument } from 'src/comman/schema/ride.schema';
import { DriverPayout, DriverPayoutDocument } from 'src/comman/schema/payout.schema';
import { Model } from 'mongoose';

@ApiTags('Driver')
@ApiBearerAuth()
@Roles(Role.Driver)
@UseGuards(AuthGuards, RoleGuards)
@Controller('driver')
export class DriverController {
  constructor(private readonly driverService: DriverService,
    @InjectModel(Ride.name) private rideModel: Model<RideDocument>,
    @InjectModel(DriverPayout.name) private driverPayoutModel: Model<DriverPayoutDocument>,

  ) { }

  @Post('setup-account')
  @ApiOperation({
    summary: 'Set up driver account',
    description: 'Allows a driver to set up their account with vehicle and personal details.'
  })
  @ApiBody({ type: SetupDriverAccountDto })
  @ApiResponse({ status: 201, description: 'Driver account set up successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized access.' })
  @ApiResponse({ status: 403, description: 'Driver role required.' })
  async setupDriverAccount(@Req() req, @Body() setupDriverAccountDto: SetupDriverAccountDto) {
    return this.driverService.setupDriverAccount(req, setupDriverAccountDto);
  }

  @Post('payout-account')
  @ApiOperation({
    summary: 'Create driver payout account',
    description: 'Sets up a payout account for the driver to receive earnings.'
  })
  @ApiBody({ type: CreateDriverPayoutDto })
  @ApiResponse({ status: 201, description: 'Payout account created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid payout account details.' })
  @ApiResponse({ status: 401, description: 'Unauthorized access.' })
  @ApiResponse({ status: 403, description: 'Driver role required.' })
  async createPayoutAccount(@Req() req, @Body() createDriverPayoutDto: CreateDriverPayoutDto) {
    return this.driverService.createPaymentAccount(req, createDriverPayoutDto);
  }

  @Get('payout-accounts')
@ApiOperation({ summary: 'Get driver payout accounts' })
@ApiResponse({
  status: 200,
  description: 'Returns all payout accounts for the driver.'
})
async getPayoutAccounts(@Req() req) {
  const driverId = req.user?._id;

  const payoutAccounts = await this.driverPayoutModel.find({
    driverId,
    isActive: true,
  })
    .sort({ isDefault: -1, createdAt: -1 })
    .select('-_id -__v -createdAt -updatedAt -driverId -isDefault');

  const protectedData = payoutAccounts.map((acc: any) => ({
    ...acc.toObject(),
    accountNumber: acc.accountNumber
      ? `****${acc.accountNumber.slice(-4)}`
      : null,
    ifsc: acc.ifsc
      ? `****${acc.ifsc.slice(-4)}`
      : null,
  }));

  return { success: true, data: protectedData };
}


  @Get('earnings')
  @ApiOperation({
    summary: 'Retrieve driver earnings',
    description: 'Fetches the total earnings for the authenticated driver.'
  })
  @ApiResponse({ status: 200, description: 'Driver earnings retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized access.' })
  @ApiResponse({ status: 403, description: 'Driver role required.' })
  @ApiResponse({ status: 404, description: 'Driver earnings not found.' })
  async getDriverEarnings(@Req() req) {
    return this.driverService.getDriverEarnings(req);
  }

  @Get('earnings/history')
  @ApiOperation({
    summary: 'Retrieve driver earnings history',
    description: 'Fetches the paginated earnings history for the authenticated driver.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiResponse({ status: 200, description: 'Earnings history retrieved successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid pagination parameters.' })
  @ApiResponse({ status: 401, description: 'Unauthorized access.' })
  @ApiResponse({ status: 403, description: 'Driver role required.' })
  @ApiResponse({ status: 404, description: 'No earnings history found.' })
  async getDriverEarningsHistory(
    @Req() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    return this.driverService.getDriverEarningsHistory(req, page, limit);
  }

  // @Post('pay-driver/:driverId')
  // async payDriver(@Param('driverId') driverId: string) {
  //   // Get unpaid rides
  //   const rides = await this.rideModel.find({
  //     driver: driverId,
  //     status: { $in: ['completed', 'cancelled'] },
  //     driverPaymentStatus: { $ne: 'paid' },
  //   }).exec();

  //   if (!rides.length) {
  //     throw new BadRequestException('No unpaid rides found for this driver');
  //   }

  //   // Get driver payout account
  //   const payoutDetails = await this.driverPayoutModel.findOne({ driverId, isActive: true, isDefault: true });
  //   if (!payoutDetails) throw new BadRequestException('No payout account found');

  //   const driverPayment = await this.driverService.payDriver(driverId, rides, payoutDetails);

  //   return { success: true, driverPayment, ridesPaid: rides.length };
  // }
}