import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { GetUsersDto } from './dto/get-users.dto';
import { CreateNewEntryDto } from './dto/create-admin.dto';
import { Roles } from 'src/comman/decorator/role.decorator';
import { AuthGuards } from 'src/comman/guards/auth.guards';
import { RoleGuards} from 'src/comman/guards/role.guards';
import { Role } from 'src/comman/enums/role.enum';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DeleteEntryDto } from './dto/delete-entry.dto';
import { UpdateEntryDto } from './dto/update-admin.dto';

@Controller('admin')
@UseGuards(AuthGuards,RoleGuards)
@ApiBearerAuth()
export class AdminController {
  
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @Roles(Role.Admin,Role.SuperAdmin)
  getUsers(@Query() getUsersDto : GetUsersDto){
    return this.adminService.getUsersDetails();
  }

  @Post("create-admin")
  @Roles(Role.SuperAdmin)
  createNewAdmin(@Body() createNewEntryDto : CreateNewEntryDto){
    return this.adminService.createNewEntry(createNewEntryDto,Role.Admin);
  }

  @Post("create-user")
  @Roles(Role.Admin,Role.SuperAdmin)
  createNewUser(@Body() createNewEntryDto : CreateNewEntryDto){
    return this.adminService.createNewEntry(createNewEntryDto,Role.User);
  }


  @Delete("delete-admin/:_id")
  @Roles(Role.SuperAdmin)
  deleteAdmin(@Param() deleteEntryDto : DeleteEntryDto){
    return this.adminService.deleteEntry(deleteEntryDto,Role.Admin);
  }

  @Delete("delete-user/:_id")
  @Roles(Role.Admin,Role.SuperAdmin)
  deleteUser(@Param() deleteEntryDto : DeleteEntryDto){
    return this.adminService.deleteEntry(deleteEntryDto,Role.User);
  }

  @Patch("update-admin")
  @Roles(Role.SuperAdmin)
  updateAdminDetails(@Body() updateEntryDto : UpdateEntryDto){
    return this.adminService.deleteEntry(updateEntryDto,Role.Admin);
  } 

  @Patch("update-user")
  @Roles(Role.Admin,Role.SuperAdmin)
  updateUserDetails(@Body() updateEntryDto : UpdateEntryDto){
    return this.adminService.updateEntry(updateEntryDto,Role.User);
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



  @Get("ride_invoice/:rideId")
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiParam({ name: 'rideId', type: String, description: 'ID of the ride to fetch invoice for' })
  getRideInvoice(@Param('rideId') rideId: string) {
    return this.adminService.getRideInvoice(rideId);
  }

   @Get("get_total_earning")
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Get total earnings with filter' })
  @ApiQuery({ name: 'filter', enum: ['last_hour','1_day','10_days','1_month'], required: true })
  async getTotalEarning(@Query('filter') filter: string) {
    return this.adminService.getTotalEarning(filter);
  }

  @Get('generate_invoice')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ summary: 'Generate invoice PDF for filtered earnings' })
  @ApiQuery({ name: 'filter', enum: ['last_hour','1_day','10_days','1_month'], required: true })
  async generateInvoice(@Query('filter') filter: string) {
    return this.adminService.generateEarningInvoice(filter);
  }
  
}