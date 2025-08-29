// // src/modules/company/company.service.ts
// import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { CompanyDetails, CompanyDetailsDocument } from 'src/comman/schema/company.detail.schema';
// import { CreateCompanyDetailsDto } from './dto/create-company-detail.dto';
// import ApiResponse from 'src/comman/helpers/api-response';
// import Api from 'twilio/lib/rest/Api';


// @Injectable()
// export class CompanyService {
//   constructor(
//     @InjectModel(CompanyDetails.name) 
//     private readonly companyDetailsModel: Model<CompanyDetailsDocument>,
//   ) {}

//   async createOrUpdateCompanyDetails(createDto: CreateCompanyDetailsDto): Promise<ApiResponse<any>> {
//     try {
//       // Check if company details already exist
//       const existingDetails = await this.companyDetailsModel.findOne();

//       let companyDetails: CompanyDetailsDocument;
//       let message: string;
//       let status: HttpStatus;

//       if (existingDetails) {
//         // Update existing details
//         companyDetails = await this.companyDetailsModel.findByIdAndUpdate(
//           existingDetails._id,
//           { $set: createDto },
//           { new: true, runValidators: true }
//         ) as any;
//         message = 'Company details updated successfully';
//         status = HttpStatus.OK;
//       } else {
//         // Create new details
//         companyDetails = await this.companyDetailsModel.create(createDto);
//         message = 'Company details created successfully';
//         status = HttpStatus.CREATED;
//       }

//       return new ApiResponse(true, message, status, companyDetails);
//     } catch (error) {
//       if (error.code === 11000) {
//         throw new HttpException(
//           'Company details already exist. Use update instead.',
//           HttpStatus.CONFLICT
//         );
//       }
//       throw new HttpException(
//         `Failed to save company details: ${error.message}`,
//         HttpStatus.INTERNAL_SERVER_ERROR
//       );
//     }
//   }

//   async getCompanyDetails(): Promise<ApiResponse<any>> {
//     try {
//       const companyDetails = await this.companyDetailsModel.findOne();

//       if (!companyDetails) {
//         throw new HttpException('Company details not found', HttpStatus.NOT_FOUND);
//       }

//       return new ApiResponse(
//         true,
//         'Company details retrieved successfully',
//         HttpStatus.OK,
//         companyDetails
//       );
//     } catch (error) {
//       throw new HttpException(
//         `Failed to retrieve company details: ${error.message}`,
//         HttpStatus.INTERNAL_SERVER_ERROR
//       );
//     }
//   }

//   async getPublicCompanyDetails(): Promise<ApiResponse<any>> {
//     try {
//       const companyDetails = await this.companyDetailsModel.findOne().select(
//         'companyName tradingName logo tagline description email website contactNumbers address additionalAddresses socialMedia operatingHours foundedDate version'
//       );

//       if (!companyDetails) {
//         throw new HttpException('Company details not found', HttpStatus.NOT_FOUND);
//       }

//       return new ApiResponse(
//         true,
//         'Public company details retrieved successfully',
//         HttpStatus.OK,
//         companyDetails
//       );
//     } catch (error) {
//       throw new HttpException(
//         `Failed to retrieve public company details: ${error.message}`,
//         HttpStatus.INTERNAL_SERVER_ERROR
//       );
//     }
//   }

//   async deleteCompanyDetails(): Promise<ApiResponse<any>> {
//     try {
//       const result = await this.companyDetailsModel.deleteOne();

//       if (result.deletedCount === 0) {
//         throw new HttpException('Company details not found', HttpStatus.NOT_FOUND);
//       }

//       return new ApiResponse(
//         true,
//         'Company details deleted successfully',
//         HttpStatus.OK,
//         null
//       );
//     } catch (error) {
//       throw new HttpException(
//         `Failed to delete company details: ${error.message}`,
//         HttpStatus.INTERNAL_SERVER_ERROR
//       );
//     }
//   }

//   async updateSocialMedia():Promise<ApiResponse<any>>{
//     try {
      

//         return new ApiResponse(
//         true,
//         'Company details deleted successfully',
//         HttpStatus.OK,
//         null
//       );
//     } catch (error) {
//        throw new HttpException(
//         `Failed to delete company details: ${error.message}`,
//         HttpStatus.INTERNAL_SERVER_ERROR
//       );
//     }
//   }
// }







// src/modules/company/company.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CompanyAddress, CompanyAddressDocument, CompanyContactNumber, CompanyContactNumberDocument, CompanyDetails, CompanyDetailsDocument, CompanySocialMedia, CompanySocialMediaDocument } from 'src/comman/schema/company.detail.schema';
import { CompanyAddressDto, CompanyContactNumberDto, CompanySocialMediaDto, CreateCompanyDetailsDto } from './dto/create-company-detail.dto';
import ApiResponse from 'src/comman/helpers/api-response';


@Injectable()
export class CompanyService {
  constructor(
    @InjectModel(CompanyDetails.name) private companyDetailsModel: Model<CompanyDetailsDocument>,
    @InjectModel(CompanyAddress.name) private companyAddressModel: Model<CompanyAddressDocument>,
    @InjectModel(CompanyContactNumber.name) private companyContactNumberModel: Model<CompanyContactNumberDocument>,
    @InjectModel(CompanySocialMedia.name) private companySocialMediaModel: Model<CompanySocialMediaDocument>,
  ) {}

  async createOrUpdateCompanyDetails(createDto: CreateCompanyDetailsDto): Promise<ApiResponse<any>> {
    try {
      const existingDetails = await this.companyDetailsModel.findOne();

      let companyDetails: CompanyDetailsDocument;
      let message: string;
      let status: HttpStatus;

      // Extract sub-entity data from DTO
      const { address, additionalAddresses = [], contactNumbers = [], socialMedia = [], ...companyData } = createDto;

      if (existingDetails) {
        // For update: Replace old sub-documents (delete and create new)
        if (existingDetails.addressId) {
          await this.companyAddressModel.findByIdAndDelete(existingDetails.addressId);
        }
        if (existingDetails.additionalAddressIds?.length) {
          await this.companyAddressModel.deleteMany({ _id: { $in: existingDetails.additionalAddressIds } });
        }
        if (existingDetails.contactNumberIds?.length) {
          await this.companyContactNumberModel.deleteMany({ _id: { $in: existingDetails.contactNumberIds } });
        }
        if (existingDetails.socialMediaIds?.length) {
          await this.companySocialMediaModel.deleteMany({ _id: { $in: existingDetails.socialMediaIds } });
        }

        // Create new sub-documents
        const { addressId, additionalAddressIds, contactNumberIds, socialMediaIds } = await this.createSubDocuments(
          address,
          additionalAddresses,
          contactNumbers,
          socialMedia,
          existingDetails._id,
        );

        // Update company details with new IDs
        const updatedDetails = await this.companyDetailsModel.findByIdAndUpdate(
          existingDetails._id,
          {
            ...companyData,
            addressId,
            additionalAddressIds,
            contactNumberIds,
            socialMediaIds,
          },
          { new: true, runValidators: true },
        );

        if (!updatedDetails) {
          throw new HttpException('Failed to update company details: Document not found', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        companyDetails = updatedDetails; // Type-safe assignment
        message = 'Company details updated successfully';
        status = HttpStatus.OK;
      } else {
        // For create: Create sub-documents first
        const { addressId, additionalAddressIds, contactNumberIds, socialMediaIds } = await this.createSubDocuments(
          address,
          additionalAddresses,
          contactNumbers,
          socialMedia,
        );

        // Create company details with IDs
        companyDetails = await this.companyDetailsModel.create({
          ...companyData,
          addressId,
          additionalAddressIds,
          contactNumberIds,
          socialMediaIds,
        });

        // Update sub-documents with companyId for back-reference
        await this.updateSubDocumentsWithCompanyId(
          companyDetails._id,
          addressId,
          additionalAddressIds,
          contactNumberIds,
          socialMediaIds,
        );

        message = 'Company details created successfully';
        status = HttpStatus.CREATED;
      }

      return new ApiResponse(true, message, status, companyDetails);
    } catch (error) {
      if (error.code === 11000) {
        throw new HttpException('Company details already exist. Use update instead.', HttpStatus.CONFLICT);
      }
      throw new HttpException(`Failed to save company details: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async createSubDocuments(
    addressData: any,
    additionalAddressesData: any[],
    contactNumbersData: any[],
    socialMediaData: any[],
    companyId?: any,
  ) {
    // Create primary address
    const addressDoc = await this.companyAddressModel.create({ ...addressData, companyId });
    const addressId = addressDoc._id;

    // Create additional addresses
    const additionalAddressDocs = await this.companyAddressModel.insertMany(
      additionalAddressesData.map((addr) => ({ ...addr, companyId })),
    );
    const additionalAddressIds = additionalAddressDocs.map((doc) => doc._id);

    // Create contact numbers
    const contactNumberDocs = await this.companyContactNumberModel.insertMany(
      contactNumbersData.map((num) => ({ ...num, companyId })),
    );
    const contactNumberIds = contactNumberDocs.map((doc) => doc._id);

    // Create social media
    const socialMediaDocs = await this.companySocialMediaModel.insertMany(
      socialMediaData.map((sm) => ({ ...sm, companyId })),
    );
    const socialMediaIds = socialMediaDocs.map((doc) => doc._id);

    return { addressId, additionalAddressIds, contactNumberIds, socialMediaIds };
  }

  private async updateSubDocumentsWithCompanyId(
    companyId: any,
    addressId: any,
    additionalAddressIds: any[],
    contactNumberIds: any[],
    socialMediaIds: any[],
  ) {
    await this.companyAddressModel.findByIdAndUpdate(addressId, { companyId });
    if (additionalAddressIds.length) {
      await this.companyAddressModel.updateMany({ _id: { $in: additionalAddressIds } }, { companyId });
    }
    if (contactNumberIds.length) {
      await this.companyContactNumberModel.updateMany({ _id: { $in: contactNumberIds } }, { companyId });
    }
    if (socialMediaIds.length) {
      await this.companySocialMediaModel.updateMany({ _id: { $in: socialMediaIds } }, { companyId });
    }
  }

  async getCompanyDetails() {
    const details = await this.companyDetailsModel
      .findOne()
      .populate('addressId')
      .populate('additionalAddressIds')
      .populate('contactNumberIds')
      .populate('socialMediaIds')
      .exec();
    if (!details) {
      throw new HttpException('Company details not found', HttpStatus.NOT_FOUND);
    }
    return new ApiResponse(true, 'Company details retrieved successfully', HttpStatus.OK, details);
  }

  async getPublicCompanyDetails() {
    const details = await this.companyDetailsModel
      .findOne()
      .select('companyName tradingName logo tagline description website addressId socialMediaIds')
      .populate('addressId')
      .populate('socialMediaIds')
      .exec();
    if (!details) {
      throw new HttpException('Company details not found', HttpStatus.NOT_FOUND);
    }
    return new ApiResponse(true, 'Public company details retrieved successfully', HttpStatus.OK, details);
  }

  async deleteCompanyDetails() {
    const details = await this.companyDetailsModel.findOne();
    if (details) {
      if (details.addressId) await this.companyAddressModel.findByIdAndDelete(details.addressId);
      if (details.additionalAddressIds?.length)
        await this.companyAddressModel.deleteMany({ _id: { $in: details.additionalAddressIds } });
      if (details.contactNumberIds?.length)
        await this.companyContactNumberModel.deleteMany({ _id: { $in: details.contactNumberIds } });
      if (details.socialMediaIds?.length)
        await this.companySocialMediaModel.deleteMany({ _id: { $in: details.socialMediaIds } });
      await this.companyDetailsModel.findByIdAndDelete(details._id);
    }
    return new ApiResponse(true, 'Company details deleted successfully', HttpStatus.OK, null);
  }

  async updateSocialMedia(updateDto: any) {
    // Implement logic to update specific social media documents
    // For example, find by companyId or specific social media ID and update
    throw new HttpException('Not implemented', HttpStatus.NOT_IMPLEMENTED);
  }

  async addCompanyAddress(addressDto: CompanyAddressDto): Promise<ApiResponse<any>> {
    try {
      const companyDetails = await this.companyDetailsModel.findOne();
      if (!companyDetails) {
        throw new HttpException('Company details not found', HttpStatus.NOT_FOUND);
      }

      const addressDoc = await this.companyAddressModel.create({
        ...addressDto,
        companyId: companyDetails._id,
      });

      // Add to additionalAddressIds
      const updatedDetails = await this.companyDetailsModel.findByIdAndUpdate(
        companyDetails._id,
        { $push: { additionalAddressIds: addressDoc._id } },
        { new: true, runValidators: true },
      );

      if (!updatedDetails) {
        throw new HttpException('Failed to update company details', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return new ApiResponse(true, 'Company address added successfully', HttpStatus.CREATED, addressDoc);
    } catch (error) {
      throw new HttpException(`Failed to add company address: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async addCompanyContactNumber(contactNumberDto:CompanyContactNumberDto): Promise<ApiResponse<any>> {
    try {
      const companyDetails = await this.companyDetailsModel.findOne();
      if (!companyDetails) {
        throw new HttpException('Company details not found', HttpStatus.NOT_FOUND);
      }

      const contactNumberDoc = await this.companyContactNumberModel.create({
        ...contactNumberDto,
        companyId: companyDetails._id,
      });

      // Add to contactNumberIds
      const updatedDetails = await this.companyDetailsModel.findByIdAndUpdate(
        companyDetails._id,
        { $push: { contactNumberIds: contactNumberDoc._id } },
        { new: true, runValidators: true },
      );

      if (!updatedDetails) {
        throw new HttpException('Failed to update company details', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return new ApiResponse(true, 'Company contact number added successfully', HttpStatus.CREATED, contactNumberDoc);
    } catch (error) {
      throw new HttpException(`Failed to add company contact number: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async addCompanySocialMedia(socialMediaDto: CompanySocialMediaDto): Promise<ApiResponse<any>> {
    try {
      const companyDetails = await this.companyDetailsModel.findOne();
      if (!companyDetails) {
        throw new HttpException('Company details not found', HttpStatus.NOT_FOUND);
      }

      const socialMediaDoc = await this.companySocialMediaModel.create({
        ...socialMediaDto,
        companyId: companyDetails._id,
      });

      // Add to socialMediaIds
      const updatedDetails = await this.companyDetailsModel.findByIdAndUpdate(
        companyDetails._id,
        { $push: { socialMediaIds: socialMediaDoc._id } },
        { new: true, runValidators: true },
      );

      if (!updatedDetails) {
        throw new HttpException('Failed to update company details', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return new ApiResponse(true, 'Company social media profile added successfully', HttpStatus.CREATED, socialMediaDoc);
    } catch (error) {
      throw new HttpException(`Failed to add company social media: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  
}