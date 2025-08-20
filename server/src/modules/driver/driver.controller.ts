import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
// import { DriverService } from './driver.service';

import { Role } from 'src/comman/enums/role.enum';
import { Roles } from 'src/comman/decorator/role.decorator';
import { AuthGuards } from 'src/comman/guards/auth.guards';
import { RoleGuards } from 'src/comman/guards/role.guards';
import { SetupDriverAccountDto } from './dto/SetupDriverAccount.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { DriverService } from './driver.service';

@Controller('driver')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Post()
  @Roles(Role.Driver)
  @UseGuards(AuthGuards, RoleGuards)
  @ApiBearerAuth()
  setupDriverAccount(
    @Req() request: any,
    @Body() setupDriverAccountDto: SetupDriverAccountDto,
  ) {
    return this.driverService.setupDriverAccount(request, setupDriverAccountDto);
  }
}
