import { GetUsersDto } from './dto/get-users.dto';
import ApiResponse from 'src/comman/helpers/api-response';
import { ConfigService } from '@nestjs/config';
import { CreateNewEntryDto } from './dto/create-admin.dto';
import { DeleteEntryDto } from './dto/delete-entry.dto';
import { UpdateEntryDto } from './dto/update-admin.dto';
import { User, UserDocument } from 'src/comman/schema/user.schema';
import { PaginateModel, Types } from 'mongoose';
export type UserRole = 'super-admin' | 'admin' | 'user';
export declare class AdminService {
    private userModel;
    private configService;
    constructor(userModel: PaginateModel<UserDocument>, configService: ConfigService);
    seedSuperAdminData(): Promise<void>;
    getUsersDetails(getUsersDto: GetUsersDto): Promise<ApiResponse<(import("mongoose").Document<unknown, {}, UserDocument, {}, {}> & User & Document & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    })[]>>;
    createNewEntry(createNewEntryDto: CreateNewEntryDto, role?: UserRole): Promise<ApiResponse<{
        _id: Types.ObjectId;
    }>>;
    deleteEntry(deleteEntryDto: DeleteEntryDto, role?: UserRole): Promise<ApiResponse<unknown>>;
    updateEntry(updateEntryDto: UpdateEntryDto, role?: UserRole): Promise<ApiResponse<(import("mongoose").Document<unknown, {}, UserDocument, {}, {}> & User & Document & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }) | null>>;
}
