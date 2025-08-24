import { Controller, Post, Body, UseGuards, Req, Get, Query } from '@nestjs/common';
import { DriverService } from './driver.service';
import { SetupDriverAccountDto } from './dto/SetupDriverAccount.dto';
import { CreateDriverPayoutDto } from './dto/CreatePaymentAccount.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AuthGuards } from 'src/comman/guards/auth.guards';
import { RoleGuards } from 'src/comman/guards/role.guards';
import { Roles } from 'src/comman/decorator/role.decorator';
import { Role } from 'src/comman/enums/role.enum';

@ApiTags('Driver')
@ApiBearerAuth()
@Roles(Role.Driver)
@UseGuards(AuthGuards, RoleGuards)
@Controller('driver')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

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
}