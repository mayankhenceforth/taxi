import { AdminService } from './admin.service';
import { GetUsersDto } from './dto/get-users.dto';
import { CreateNewEntryDto } from './dto/create-admin.dto';
import { DeleteEntryDto } from './dto/delete-entry.dto';
import { UpdateEntryDto } from './dto/update-admin.dto';
import { Response } from 'express';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getUsers(getUsersDto: GetUsersDto): Promise<any[]>;
    createNewAdmin(createNewEntryDto: CreateNewEntryDto): Promise<import("../../comman/helpers/api-response").default<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    createNewUser(createNewEntryDto: CreateNewEntryDto): Promise<import("../../comman/helpers/api-response").default<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    deleteAdmin(deleteEntryDto: DeleteEntryDto): Promise<import("../../comman/helpers/api-response").default<unknown>>;
    deleteUser(deleteEntryDto: DeleteEntryDto): Promise<import("../../comman/helpers/api-response").default<unknown>>;
    updateAdminDetails(updateEntryDto: UpdateEntryDto): Promise<import("../../comman/helpers/api-response").default<(import("mongoose").Document<unknown, {}, import("../../comman/schema/user.schema").UserDocument, {}, {}> & import("../../comman/schema/user.schema").User & Document & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }) | null>>;
    updateUserDetails(updateEntryDto: UpdateEntryDto): Promise<import("../../comman/helpers/api-response").default<(import("mongoose").Document<unknown, {}, import("../../comman/schema/user.schema").UserDocument, {}, {}> & import("../../comman/schema/user.schema").User & Document & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }) | null>>;
    getRideDetails(): Promise<any[]>;
    getTemporaryRideDetails(): Promise<any[]>;
    getAllRideWithStatus(body: {
        status: string;
    }): Promise<{
        status: string;
        rides: any[];
    }>;
    getRideInvoice(rideId: string): Promise<string | undefined>;
    getTotalEarning(filter: string, res: Response): Promise<Response<any, Record<string, any>>>;
    getNewUsers(filter: string, res: Response): Promise<Response<any, Record<string, any>>>;
    getNewRides(filter: string, res: Response): Promise<Response<any, Record<string, any>>>;
    processRefund(rideId: string): Promise<import("../../comman/helpers/api-response").default<{
        rideId: unknown;
        refundStatus: "processed";
    }>>;
}
