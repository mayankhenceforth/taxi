// src/modules/company/company.controller.ts
import {
    Controller,
    Post,
    Body,
    Get,
    Delete,
    UseGuards,
    HttpStatus
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiBody
} from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { AuthGuards } from 'src/comman/guards/auth.guards';
import { RoleGuards } from 'src/comman/guards/role.guards';
import { Role } from 'src/comman/enums/role.enum';
import { Roles } from 'src/comman/decorator/role.decorator';
import { CreateCompanyDetailsDto } from './dto/create-company-detail.dto';

@ApiTags('Company')
@ApiBearerAuth()
@Controller('company')
export class CompanyController {
    constructor(private readonly companyService: CompanyService) { }

    @Post('details')
    @UseGuards(AuthGuards, RoleGuards)
    @Roles(Role.SuperAdmin, Role.Admin)
    @ApiOperation({ summary: 'Create or update company details' })
    @ApiBody({ type: CreateCompanyDetailsDto })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Company details created successfully'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Company details updated successfully'
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Insufficient permissions'
    })
    async createOrUpdateCompanyDetails(@Body() createDto: CreateCompanyDetailsDto) {
        return this.companyService.createOrUpdateCompanyDetails(createDto);
    }

    @Get('details')
    @ApiOperation({ summary: 'Get complete company details (Authenticated)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Company details retrieved successfully'
    })
    async getCompanyDetails() {
        return this.companyService.getCompanyDetails();
    }

    @Get('details/public')
    @ApiOperation({ summary: 'Get public company details' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Public company details retrieved successfully'
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
        description: 'Company details deleted successfully'
    })
    async deleteCompanyDetails() {
        return this.companyService.deleteCompanyDetails();
    }
}