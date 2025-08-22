import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { GetUsersDto } from './dto/get-users.dto';
import { CreateNewEntryDto } from './dto/create-admin.dto';
import { Roles } from 'src/comman/decorator/role.decorator';
import { AuthGuards } from 'src/comman/guards/auth.guards';
import { RoleGuards } from 'src/comman/guards/role.guards';
import { Role } from 'src/comman/enums/role.enum';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DeleteEntryDto } from './dto/delete-entry.dto';
import { UpdateEntryDto } from './dto/update-admin.dto';
import { Response } from 'express';

@Controller('admin')
@UseGuards(AuthGuards, RoleGuards)
@ApiBearerAuth()
export class AdminController {

  constructor(private readonly adminService: AdminService) { }

  @Get('users')
  @Roles(Role.Admin, Role.SuperAdmin)
  getUsers(@Query() getUsersDto: GetUsersDto) {
    return this.adminService.getUsersDetails();
  }

  @Post("create-admin")
  @Roles(Role.SuperAdmin)
  createNewAdmin(@Body() createNewEntryDto: CreateNewEntryDto) {
    return this.adminService.createNewEntry(createNewEntryDto, Role.Admin);
  }

  @Post("create-user")
  @Roles(Role.Admin, Role.SuperAdmin)
  createNewUser(@Body() createNewEntryDto: CreateNewEntryDto) {
    return this.adminService.createNewEntry(createNewEntryDto, Role.User);
  }


  @Delete("delete-admin/:_id")
  @Roles(Role.SuperAdmin)
  deleteAdmin(@Param() deleteEntryDto: DeleteEntryDto) {
    return this.adminService.deleteEntry(deleteEntryDto, Role.Admin);
  }

  @Delete("delete-user/:_id")
  @Roles(Role.Admin, Role.SuperAdmin)
  deleteUser(@Param() deleteEntryDto: DeleteEntryDto) {
    return this.adminService.deleteEntry(deleteEntryDto, Role.User);
  }

  @Patch("update-admin")
  @Roles(Role.SuperAdmin)
  updateAdminDetails(@Body() updateEntryDto: UpdateEntryDto) {
    return this.adminService.deleteEntry(updateEntryDto, Role.Admin);
  }

  @Patch("update-user")
  @Roles(Role.Admin, Role.SuperAdmin)
  updateUserDetails(@Body() updateEntryDto: UpdateEntryDto) {
    return this.adminService.updateEntry(updateEntryDto, Role.User);
  }

  @Get("all_ride")
  @Roles(Role.Admin, Role.SuperAdmin)
  getRideDetails() {
    return this.adminService.getAllRideDetails();
  }

  @Get("all_temp_ride")
  @Roles(Role.Admin, Role.SuperAdmin)
  getTemporaryRideDetails() {
    return this.adminService.getAllTemporaryRideDetails();

  }

  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'completed' }  // Example status
      },
      required: ['status'],
    },
  })
  @Post("all_ride_with_status")
  @Roles(Role.Admin, Role.SuperAdmin)
  getAllRideWithStatus(
    @Body() body: { status: string }
  ) {
    return this.adminService.getAllRideWithStatus(body.status);
  }



  @Get("ride_report/:rideId")
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiParam({ name: 'rideId', type: String, description: 'ID of the ride to fetch invoice for' })
  getRideInvoice(@Param('rideId') rideId: string) {
    return this.adminService.getRideInvoice(rideId);
  }

  @Get("total_earning_report/:filter")
  @Roles(Role.Admin, Role.SuperAdmin)
  async getTotalEarning(
    @Param("filter") filter: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.adminService.getTotalEarning(filter);
     res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="total-income-${filter || 'all'}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });
    return res.end(pdfBuffer);
  }

@Get("new_users_report/:filter")
  @Roles(Role.Admin, Role.SuperAdmin)
  async getNewUsers(
    @Param("filter") filter: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.adminService.getNewUsers(filter);
     res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="total-income-${filter || 'all'}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });
    return res.end(pdfBuffer);
  }

  @Get("new_rides_report/:filter")
  @Roles(Role.Admin, Role.SuperAdmin)
  async getNewRides(
    @Param("filter") filter: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.adminService.getNewRides(filter);
     res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="total-income-${filter || 'all'}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });
    return res.end(pdfBuffer);
  }

  @Post("payment_refund/:rideId")
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Process a refund for a specific ride' })
  @ApiParam({ name: 'rideId', type: String, description: 'ID of the ride to refund' })
  
  processRefund(@Param('rideId') rideId: string) {
    return this.adminService.processRefund(rideId);
  }



}