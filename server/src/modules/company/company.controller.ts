// // src/modules/company/company.controller.ts
// import {
//     Controller,
//     Post,
//     Body,
//     Get,
//     Delete,
//     UseGuards,
//     HttpStatus,
//     Patch
// } from '@nestjs/common';
// import {
//     ApiTags,
//     ApiOperation,
//     ApiResponse,
//     ApiBearerAuth,
//     ApiBody
// } from '@nestjs/swagger';
// import { CompanyService } from './company.service';
// import { AuthGuards } from 'src/comman/guards/auth.guards';
// import { RoleGuards } from 'src/comman/guards/role.guards';
// import { Role } from 'src/comman/enums/role.enum';
// import { Roles } from 'src/comman/decorator/role.decorator';
// import { CreateCompanyDetailsDto } from './dto/create-company-detail.dto';

// @ApiTags('Company')
// @ApiBearerAuth()
// @Controller('company')
// export class CompanyController {
//     constructor(private readonly companyService: CompanyService) { }

//     @Post('details')
//     @UseGuards(AuthGuards, RoleGuards)
//     @Roles(Role.SuperAdmin, Role.Admin)
//     @ApiOperation({ summary: 'Create or update company details' })
//     @ApiBody({ type: CreateCompanyDetailsDto })
//     @ApiResponse({
//         status: HttpStatus.CREATED,
//         description: 'Company details created successfully'
//     })
//     @ApiResponse({
//         status: HttpStatus.OK,
//         description: 'Company details updated successfully'
//     })
//     @ApiResponse({
//         status: HttpStatus.FORBIDDEN,
//         description: 'Insufficient permissions'
//     })
//     async createOrUpdateCompanyDetails(@Body() createDto: CreateCompanyDetailsDto) {
//         return this.companyService.createOrUpdateCompanyDetails(createDto);
//     }

//     @Get('details')
//     @ApiOperation({ summary: 'Get complete company details (Authenticated)' })
//     @ApiResponse({
//         status: HttpStatus.OK,
//         description: 'Company details retrieved successfully'
//     })
//     async getCompanyDetails() {
//         return this.companyService.getCompanyDetails();
//     }

//     @Get('details/public')
//     @ApiOperation({ summary: 'Get public company details' })
//     @ApiResponse({
//         status: HttpStatus.OK,
//         description: 'Public company details retrieved successfully'
//     })
//     async getPublicCompanyDetails() {
//         return this.companyService.getPublicCompanyDetails();
//     }

//     @Delete('details')
//     @UseGuards(AuthGuards, RoleGuards)
//     @Roles(Role.SuperAdmin)
//     @ApiOperation({ summary: 'Delete company details (Super Admin only)' })
//     @ApiResponse({
//         status: HttpStatus.OK,
//         description: 'Company details deleted successfully'
//     })
//     async deleteCompanyDetails() {
//         return this.companyService.deleteCompanyDetails();
//     }

//     @Patch('soicalmedia')
//     @UseGuards(AuthGuards ,RoleGuards)
//     async upadetSocailMeadia(){

//     }
// }



// src/modules/company/company.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Patch,
  UseGuards,
  HttpStatus,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { AuthGuards } from 'src/comman/guards/auth.guards';
import { RoleGuards } from 'src/comman/guards/role.guards';
import { Roles } from 'src/comman/decorator/role.decorator';
import { Role } from 'src/comman/enums/role.enum';
import { CompanyAddressDto, CompanyContactNumberDto, CompanySocialMediaDto, CreateCompanyDetailsDto } from './dto/create-company-detail.dto';


@ApiTags('Company')
@ApiBearerAuth()
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post('details')
  @UseGuards(AuthGuards, RoleGuards)
  @Roles(Role.SuperAdmin, Role.Admin)
  @ApiOperation({ summary: 'Create or update company details' })
  @ApiBody({ type: CreateCompanyDetailsDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Company details created successfully',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Company details updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Company details already exist. Use update instead.',
  })
  async createOrUpdateCompanyDetails(@Body() createDto: CreateCompanyDetailsDto) {
    return this.companyService.createOrUpdateCompanyDetails(createDto);
  }

  @Get('details')
  @UseGuards(AuthGuards)
  @ApiOperation({ summary: 'Get complete company details (Authenticated)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Company details retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Company details not found',
  })
  async getCompanyDetails() {
    return this.companyService.getCompanyDetails();
  }

  @Get('details/public')
  @ApiOperation({ summary: 'Get public company details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Public company details retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Company details not found',
  })
  async getPublicCompanyDetails() {
    return this.companyService.getPublicCompanyDetails();
  }

  @Delete('details')
  @UseGuards(AuthGuards, RoleGuards)
  @Roles(Role.SuperAdmin)
  @ApiOperation({ summary: 'Delete company details (Super Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Company details deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async deleteCompanyDetails() {
    return this.companyService.deleteCompanyDetails();
  }

  @Patch('socialmedia')
  @UseGuards(AuthGuards, RoleGuards)
  @Roles(Role.SuperAdmin, Role.Admin)
  @ApiOperation({ summary: 'Update or add company social media profiles' })
  @ApiBody({ type: [CompanySocialMediaDto] })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Social media profiles updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async updateSocialMedia(@Body() socialMediaDtos: CompanySocialMediaDto[]) {
    return this.companyService.updateSocialMedia(socialMediaDtos);
  }

  // Additional endpoints for managing sub-collections individually
  @Post('address')
  @UseGuards(AuthGuards, RoleGuards)
  @Roles(Role.SuperAdmin, Role.Admin)
  @ApiOperation({ summary: 'Add a new company address' })
  @ApiBody({ type: CompanyAddressDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Company address added successfully',
  })
  async addCompanyAddress(@Body() addressDto: CompanyAddressDto) {
    return this.companyService.addCompanyAddress(addressDto);
  }

  @Post('contact-number')
  @UseGuards(AuthGuards, RoleGuards)
  @Roles(Role.SuperAdmin, Role.Admin)
  @ApiOperation({ summary: 'Add a new company contact number' })
  @ApiBody({ type: CompanyContactNumberDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Company contact number added successfully',
  })
  async addCompanyContactNumber(@Body() contactNumberDto: CompanyContactNumberDto) {
    return this.companyService.addCompanyContactNumber(contactNumberDto);
  }

  @Post('social-media')
  @UseGuards(AuthGuards, RoleGuards)
  @Roles(Role.SuperAdmin, Role.Admin)
  @ApiOperation({ summary: 'Add a new company social media profile' })
  @ApiBody({ type: CompanySocialMediaDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Company social media profile added successfully',
  })
  async addCompanySocialMedia(@Body() socialMediaDto: CompanySocialMediaDto) {
    return this.companyService.addCompanySocialMedia(socialMediaDto);
  }
}