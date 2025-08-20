import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { GetUsersDto } from './dto/get-users.dto';
import ApiResponse from 'src/comman/helpers/api-response';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { CreateNewEntryDto } from './dto/create-admin.dto';
import { DeleteEntryDto } from './dto/delete-entry.dto';
import { UpdateEntryDto } from './dto/update-admin.dto';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from 'src/comman/schema/user.schema';
import { PaginateModel, Types } from 'mongoose';

export type UserRole = 'super-admin' | 'admin' | 'user';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name)
    private userModel: PaginateModel<UserDocument>,
    private configService: ConfigService,
  ) {}

  /** Seed the default super-admin account if not present */
  async seedSuperAdminData() {
    try {
      const contact = this.configService.get<string>('SUPER_ADMIN_CONTACT');
      const password = this.configService.get<string>('SUPER_ADMIN_PASSWORD');

      if (!contact || !password) {
        throw new Error('Super admin credentials not set in environment variables');
      }

      const isAlreadyExisting = await this.userModel.findOne({
        contactNumber: contact,
      });

      if (!isAlreadyExisting) {
        const hashedPassword = await bcrypt.hash(password, 10);

        const superAdmin = new this.userModel({
          name: 'Super Admin',
          contactNumber: contact,
          password: hashedPassword,
          role: 'super-admin',
          isContactNumberVerified: true,
        });

        await superAdmin.save();
        console.log('Super admin seeded successfully');
      }
    } catch (error) {
      console.error(`Error occurred while seeding the admin data: ${error}`);
    }
  }

  /** Get paginated list of users */
  async getUsersDetails(getUsersDto: GetUsersDto) {
    const { limit = 10, page = 1 } = getUsersDto;

    const users = await this.userModel.paginate(
      {},
      {
        page: Number(page),
        limit: Number(limit),
        select:
          '_id name contactNumber profilePic profilePicPublicId isContactNumberVerified role',
        sort: { name: -1 },
      },
    );

    return new ApiResponse(
      true,
      'Users data fetched successfully!',
      HttpStatus.OK,
      users?.docs,
    );
  }

  /** Create a new admin or user */
  async createNewEntry(
    createNewEntryDto: CreateNewEntryDto,
    role: UserRole = 'user',
  ) {
    const existingUser = await this.userModel.findOne({
      contactNumber: createNewEntryDto.contactNumber,
    });

    if (existingUser) {
      throw new HttpException(
        'A user already exists with the same contact number!',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Hash password if provided
    if (createNewEntryDto.password) {
      createNewEntryDto.password = await bcrypt.hash(
        createNewEntryDto.password,
        10,
      );
    }

    const newEntry = new this.userModel({
      ...createNewEntryDto,
      role,
      isContactNumberVerified: true,
    });

    await newEntry.save();

    const roleInSentenceCase = role.charAt(0).toUpperCase() + role.slice(1);

    return new ApiResponse(
      true,
      `${roleInSentenceCase} created successfully!`,
      HttpStatus.CREATED,
      { _id: newEntry._id },
    );
  }

  /** Delete an entry by role */
  async deleteEntry(
    deleteEntryDto: DeleteEntryDto,
    role: UserRole = 'user',
  ) {
    const id = new Types.ObjectId(deleteEntryDto?._id);

    const existingUser = await this.userModel.findOne({ _id: id, role });

    const roleInSentenceCase = role.charAt(0).toUpperCase() + role.slice(1);

    if (!existingUser) {
      throw new HttpException(
        `${roleInSentenceCase} doesn't exist!`,
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.userModel.findByIdAndDelete(id);

    return new ApiResponse(
      true,
      `${roleInSentenceCase} deleted successfully!`,
      HttpStatus.OK,
    );
  }

  /** Update an entry by role */
  async updateEntry(
    updateEntryDto: UpdateEntryDto,
    role: UserRole = 'user',
  ) {
    const id = new Types.ObjectId(updateEntryDto?._id);

    const existingUser = await this.userModel.findOne({ _id: id, role });

    const roleInSentenceCase = role.charAt(0).toUpperCase() + role.slice(1);

    if (!existingUser) {
      throw new HttpException(
        `${roleInSentenceCase} doesn't exist!`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Hash password if updating it
    if (updateEntryDto.password) {
      updateEntryDto.password = await bcrypt.hash(
        updateEntryDto.password,
        10,
      );
    }

    const updatedEntry = await this.userModel
      .findByIdAndUpdate(
        id,
        { $set: { ...updateEntryDto } },
        { new: true },
      )
      .select(
        '_id name contactNumber profilePic profilePicPublicId isContactNumberVerified role',
      );

    return new ApiResponse(
      true,
      `${roleInSentenceCase} updated successfully!`,
      HttpStatus.OK,
      updatedEntry,
    );
  }
}
