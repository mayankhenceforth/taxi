import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import { DriverService } from './driver.service';
import { SetupDriverAccountDto } from './dto/SetupDriverAccount.dto';
import { CreateDriverPayoutDto } from './dto/CreatePaymentAccount.dt.o'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Setup driver account with vehicle details' })
  async setupDriverAccount(@Req() req, @Body() setupDriverAccountDto: SetupDriverAccountDto) {
    return this.driverService.setupDriverAccount(req, setupDriverAccountDto);
  }

  @Post('payout-account')
  @ApiOperation({ summary: 'Create payout account for driver' })
  async createPayoutAccount(@Req() req, @Body() createDriverPayoutDto: CreateDriverPayoutDto) {
    return this.driverService.createPaymentAccount(req, createDriverPayoutDto);
  }

  @Get('earnings')
  @ApiOperation({ summary: 'Get driver earnings' })
  async getDriverEarnings(@Req() req) {
  }
}