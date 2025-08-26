import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { GetUsersDto } from './dto/get-users.dto';
import { CreateNewEntryDto } from './dto/create-admin.dto';
import { Roles } from 'src/comman/decorator/role.decorator';
import { AuthGuards } from 'src/comman/guards/auth.guards';
import { RoleGuards } from 'src/comman/guards/role.guards';
import { Role } from 'src/comman/enums/role.enum';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags, ApiConsumes, ApiProduces } from '@nestjs/swagger';
import { DeleteEntryDto } from './dto/delete-entry.dto';
import { UpdateEntryDto } from './dto/update-admin.dto';
import { Response } from 'express';
import { CreateSettingDto } from './dto/create-setting.dto';

@Controller('admin')
@UseGuards(AuthGuards, RoleGuards)
@ApiBearerAuth()
@ApiTags('Admin Management')
@ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
@ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
export class AdminController {

  constructor(private readonly adminService: AdminService) { }

  @Get('users')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ 
    summary: 'Get all users', 
    description: 'Retrieve a list of all users in the system. Requires Admin or SuperAdmin role.' 
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number, 
    description: 'Page number for pagination' 
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number, 
    description: 'Number of items per page' 
  })
  @ApiResponse({ status: 200, description: 'Successfully retrieved users list' })
  getUsers(@Query() getUsersDto: GetUsersDto) {
    return this.adminService.getUsersDetails();
  }

  @Post("create-admin")
  @Roles(Role.SuperAdmin)
  @ApiOperation({ 
    summary: 'Create new admin', 
    description: 'Create a new admin user. Requires SuperAdmin role.' 
  })
  @ApiBody({ type: CreateNewEntryDto })
  @ApiResponse({ status: 201, description: 'Admin created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 409, description: 'Conflict - User already exists' })
  createNewAdmin(@Body() createNewEntryDto: CreateNewEntryDto) {
    return this.adminService.createNewEntry(createNewEntryDto, Role.Admin);
  }

  @Post("create-user")
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ 
    summary: 'Create new user', 
    description: 'Create a new regular user. Requires Admin or SuperAdmin role.' 
  })
  @ApiBody({ type: CreateNewEntryDto })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 409, description: 'Conflict - User already exists' })
  createNewUser(@Body() createNewEntryDto: CreateNewEntryDto) {
    return this.adminService.createNewEntry(createNewEntryDto, Role.User);
  }

  @Delete("delete-admin/:_id")
  @Roles(Role.SuperAdmin)
  @ApiOperation({ 
    summary: 'Delete admin', 
    description: 'Delete an admin user by ID. Requires SuperAdmin role.' 
  })
  @ApiParam({ name: '_id', type: String, description: 'MongoDB ObjectId of the admin to delete' })
  @ApiResponse({ status: 200, description: 'Admin deleted successfully' })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  deleteAdmin(@Param() deleteEntryDto: DeleteEntryDto) {
    return this.adminService.deleteEntry(deleteEntryDto, Role.Admin);
  }

  @Delete("delete-user/:_id")
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ 
    summary: 'Delete user', 
    description: 'Delete a regular user by ID. Requires Admin or SuperAdmin role.' 
  })
  @ApiParam({ name: '_id', type: String, description: 'MongoDB ObjectId of the user to delete' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  deleteUser(@Param() deleteEntryDto: DeleteEntryDto) {
    return this.adminService.deleteEntry(deleteEntryDto, Role.User);
  }

  @Patch("update-admin")
  @Roles(Role.SuperAdmin)
  @ApiOperation({ 
    summary: 'Update admin details', 
    description: 'Update admin user information. Requires SuperAdmin role.' 
  })
  @ApiBody({ type: UpdateEntryDto })
  @ApiResponse({ status: 200, description: 'Admin updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  updateAdminDetails(@Body() updateEntryDto: UpdateEntryDto) {
    return this.adminService.updateEntry(updateEntryDto, Role.Admin);
  }

  @Patch("update-user")
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ 
    summary: 'Update user details', 
    description: 'Update regular user information. Requires Admin or SuperAdmin role.' 
  })
  @ApiBody({ type: UpdateEntryDto })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  updateUserDetails(@Body() updateEntryDto: UpdateEntryDto) {
    return this.adminService.updateEntry(updateEntryDto, Role.User);
  }

  @Get("all_ride")
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ 
    summary: 'Get all rides', 
    description: 'Retrieve details of all rides in the system. Requires Admin or SuperAdmin role.' 
  })
  @ApiResponse({ status: 200, description: 'Successfully retrieved rides list' })
  getRideDetails() {
    return this.adminService.getAllRideDetails();
  }

  @Get("all_temp_ride")
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ 
    summary: 'Get all temporary rides', 
    description: 'Retrieve details of all temporary/unsaved rides. Requires Admin or SuperAdmin role.' 
  })
  @ApiResponse({ status: 200, description: 'Successfully retrieved temporary rides list' })
  getTemporaryRideDetails() {
    return this.adminService.getAllTemporaryRideDetails();
  }

  @Post("all_ride_with_status")
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ 
    summary: 'Get rides by status', 
    description: 'Retrieve rides filtered by specific status (completed, pending, cancelled, etc.). Requires Admin or SuperAdmin role.' 
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { 
          type: 'string', 
          example: 'completed',
          description: 'Ride status to filter by (completed, pending, cancelled, started)' 
        }
      },
      required: ['status'],
    },
  })
  @ApiResponse({ status: 200, description: 'Successfully retrieved filtered rides' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid status provided' })
  getAllRideWithStatus(@Body() body: { status: string }) {
    return this.adminService.getAllRideWithStatus(body.status);
  }

  @Get("ride_report/:rideId")
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ 
    summary: 'Get ride invoice', 
    description: 'Generate and retrieve a detailed invoice PDF for a specific ride. Requires Admin or SuperAdmin role.' 
  })
  @ApiParam({ 
    name: 'rideId', 
    type: String, 
    description: 'MongoDB ObjectId of the ride to generate invoice for' 
  })
  @ApiResponse({ status: 200, description: 'Successfully generated ride invoice' })
  @ApiResponse({ status: 404, description: 'Ride not found' })
  getRideInvoice(@Param('rideId') rideId: string) {
    return this.adminService.getRideInvoice(rideId);
  }

  @Get("total_earning_report/:filter")
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ 
    summary: 'Generate total earnings report', 
    description: 'Generate a PDF report of total earnings filtered by time period. Requires Admin or SuperAdmin role.' 
  })
  @ApiParam({ 
    name: 'filter', 
    type: String, 
    description: 'Time filter for the report (1h, 1d, 1w, 1m, or empty for all time)',
    examples: {
      '1 hour': { value: '1h' },
      '1 day': { value: '1d' },
      '1 week': { value: '1w' },
      '1 month': { value: '1m' },
      'All time': { value: '' }
    }
  })
  @ApiProduces('application/pdf')
  @ApiResponse({ 
    status: 200, 
    description: 'PDF report generated successfully',
    content: {
      'application/pdf': {
        schema: { type: 'string', format: 'binary' }
      }
    }
  })
  async getTotalEarning(@Param("filter") filter: string, @Res() res: Response) {
    const pdfBuffer = await this.adminService.getTotalEarning(filter);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="total-income-${filter || 'all'}.pdf"`,
      "Content-Length": pdfBuffer.length.toString(),
    });
    return res.end(pdfBuffer);
  }

  @Get("new_users_report/:filter")
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ 
    summary: 'Generate new users report', 
    description: 'Generate a PDF report of new users registered filtered by time period. Requires Admin or SuperAdmin role.' 
  })
  @ApiParam({ 
    name: 'filter', 
    type: String, 
    description: 'Time filter for the report (1h, 1d, 1w, 1m, or empty for all time)',
    examples: {
      '1 hour': { value: '1h' },
      '1 day': { value: '1d' },
      '1 week': { value: '1w' },
      '1 month': { value: '1m' },
      'All time': { value: '' }
    }
  })
  @ApiProduces('application/pdf')
  @ApiResponse({ 
    status: 200, 
    description: 'PDF report generated successfully',
    content: {
      'application/pdf': {
        schema: { type: 'string', format: 'binary' }
      }
    }
  })
  async getNewUsers(@Param("filter") filter: string, @Res() res: Response) {
    const pdfBuffer = await this.adminService.getNewUsers(filter);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="new-users-${filter || 'all'}.pdf"`,
      "Content-Length": pdfBuffer.length.toString(),
    });
    return res.end(pdfBuffer);
  }

  @Get("new_rides_report/:filter")
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ 
    summary: 'Generate new rides report', 
    description: 'Generate a PDF report of new rides created filtered by time period. Requires Admin or SuperAdmin role.' 
  })
  @ApiParam({ 
    name: 'filter', 
    type: String, 
    description: 'Time filter for the report (1h, 1d, 1w, 1m, or empty for all time)',
    examples: {
      '1 hour': { value: '1h' },
      '1 day': { value: '1d' },
      '1 week': { value: '1w' },
      '1 month': { value: '1m' },
      'All time': { value: '' }
    }
  })
  @ApiProduces('application/pdf')
  @ApiResponse({ 
    status: 200, 
    description: 'PDF report generated successfully',
    content: {
      'application/pdf': {
        schema: { type: 'string', format: 'binary' }
      }
    }
  })
  async getNewRides(@Param("filter") filter: string, @Res() res: Response) {
    const pdfBuffer = await this.adminService.getNewRides(filter);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="new-rides-${filter || 'all'}.pdf"`,
      "Content-Length": pdfBuffer.length.toString(),
    });
    return res.end(pdfBuffer);
  }

  @Post("payment_refund/:rideId")
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({ 
    summary: 'Process payment refund', 
    description: 'Initiate a refund for a specific ride payment. Requires Admin or SuperAdmin role.' 
  })
  @ApiParam({ 
    name: 'rideId', 
    type: String, 
    description: 'MongoDB ObjectId of the ride to process refund for' 
  })
  @ApiResponse({ status: 200, description: 'Refund processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Refund cannot be processed' })
  @ApiResponse({ status: 404, description: 'Ride not found' })
  @ApiResponse({ status: 500, description: 'Internal server error - Payment gateway issue' })
  processRefund(@Param('rideId') rideId: string) {
    return this.adminService.processRefund(rideId);
  }

  
@Post("pay_driver/:driverId")
@Roles(Role.Admin, Role.SuperAdmin)
@ApiOperation({ 
  summary: 'Pay driver earnings', 
  description: 'Initiates a payout to a driver for their completed rides. Requires Admin or SuperAdmin role.' 
})
@ApiResponse({ status: 200, description: 'Driver paid successfully' })
@ApiResponse({ status: 400, description: 'Bad request - Payment cannot be processed' })
@ApiResponse({ status: 404, description: 'Driver not found' })
@ApiResponse({ status: 500, description: 'Internal server error - Payment gateway issue' })
payDriver() {
  return this.adminService.payAllDrivers();
}

// Settings endpoints
  @Post('settings')
  @Roles(Role.SuperAdmin)
  @ApiOperation({
    summary: 'Create or update settings',
    description: 'Create a new settings document if none exists, or update the existing one. Requires SuperAdmin role.',
  })
  @ApiBody({ type: CreateSettingDto })
  @ApiResponse({ status: 201, description: 'Settings created successfully' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  upsertSettings(@Body() createSettingDto: CreateSettingDto,@Param('superadminId') superAdminId: string) {
    return this.adminService.upsertSettings(superAdminId,createSettingDto);
  }

  @Get('settings')
  @Roles(Role.Admin, Role.SuperAdmin)
  @ApiOperation({
    summary: 'Get settings',
    description: 'Retrieve the single settings document. Requires Admin or SuperAdmin role.',
  })
  @ApiResponse({ status: 200, description: 'Successfully retrieved settings' })
  @ApiResponse({ status: 404, description: 'Settings not found' })
  getSettings() {
    return this.adminService.getSettings();
  }

  @Delete('settings')
  @Roles(Role.SuperAdmin)
  @ApiOperation({
    summary: 'Delete settings',
    description: 'Delete the single settings document. Requires SuperAdmin role.',
  })
  @ApiResponse({ status: 200, description: 'Settings deleted successfully' })
  @ApiResponse({ status: 404, description: 'Settings not found' })
  deleteSettings() {
    return this.adminService.deleteSettings();
  }



}