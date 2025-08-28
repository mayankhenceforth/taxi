// src/modules/company/company.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CompanyDetails, CompanyDetailsDocument } from 'src/comman/schema/company.detail.schema';
import { CreateCompanyDetailsDto } from './dto/create-company-detail.dto';
import ApiResponse from 'src/comman/helpers/api-response';


@Injectable()
export class CompanyService {
  constructor(
    @InjectModel(CompanyDetails.name) 
    private readonly companyDetailsModel: Model<CompanyDetailsDocument>,
  ) {}

  async createOrUpdateCompanyDetails(createDto: CreateCompanyDetailsDto): Promise<ApiResponse<any>> {
    try {
      // Check if company details already exist
      const existingDetails = await this.companyDetailsModel.findOne();

      let companyDetails: CompanyDetailsDocument;
      let message: string;
      let status: HttpStatus;

      if (existingDetails) {
        // Update existing details
        companyDetails = await this.companyDetailsModel.findByIdAndUpdate(
          existingDetails._id,
          { $set: createDto },
          { new: true, runValidators: true }
        ) as any;
        message = 'Company details updated successfully';
        status = HttpStatus.OK;
      } else {
        // Create new details
        companyDetails = await this.companyDetailsModel.create(createDto);
        message = 'Company details created successfully';
        status = HttpStatus.CREATED;
      }

      return new ApiResponse(true, message, status, companyDetails);
    } catch (error) {
      if (error.code === 11000) {
        throw new HttpException(
          'Company details already exist. Use update instead.',
          HttpStatus.CONFLICT
        );
      }
      throw new HttpException(
        `Failed to save company details: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getCompanyDetails(): Promise<ApiResponse<any>> {
    try {
      const companyDetails = await this.companyDetailsModel.findOne();

      if (!companyDetails) {
        throw new HttpException('Company details not found', HttpStatus.NOT_FOUND);
      }

      return new ApiResponse(
        true,
        'Company details retrieved successfully',
        HttpStatus.OK,
        companyDetails
      );
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve company details: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getPublicCompanyDetails(): Promise<ApiResponse<any>> {
    try {
      const companyDetails = await this.companyDetailsModel.findOne().select(
        'companyName tradingName logo tagline description email website contactNumbers address additionalAddresses socialMedia operatingHours foundedDate version'
      );

      if (!companyDetails) {
        throw new HttpException('Company details not found', HttpStatus.NOT_FOUND);
      }

      return new ApiResponse(
        true,
        'Public company details retrieved successfully',
        HttpStatus.OK,
        companyDetails
      );
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve public company details: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteCompanyDetails(): Promise<ApiResponse<any>> {
    try {
      const result = await this.companyDetailsModel.deleteOne();

      if (result.deletedCount === 0) {
        throw new HttpException('Company details not found', HttpStatus.NOT_FOUND);
      }

      return new ApiResponse(
        true,
        'Company details deleted successfully',
        HttpStatus.OK,
        null
      );
    } catch (error) {
      throw new HttpException(
        `Failed to delete company details: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}