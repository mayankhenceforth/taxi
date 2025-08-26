import ApiResponse from 'src/comman/helpers/api-response';
import { ConfigService } from '@nestjs/config';
import { CreateNewEntryDto } from './dto/create-admin.dto';
import { DeleteEntryDto } from './dto/delete-entry.dto';
import { UpdateEntryDto } from './dto/update-admin.dto';
import { User, UserDocument } from 'src/comman/schema/user.schema';
import mongoose, { Model, PaginateModel, Types } from 'mongoose';
import { RideDocument, TemporaryRideDocument } from 'src/comman/schema/ride.schema';
import { CloudinaryService } from 'src/comman/cloudinary/cloudinary.service';
import { InvoiceService } from 'src/comman/invoice/invoice.service';
import { PaymentService } from 'src/comman/payment/payment.service';
import { DriverEarningDocument } from 'src/comman/schema/driver-earnings.schema';
import { DriverPaymentDocument } from 'src/comman/schema/DriverPaymentInfo.schema';
export type UserRole = 'super-admin' | 'admin' | 'user';
export declare class AdminService {
    private userModel;
    private readonly rideModel;
    private readonly TemporyRideModel;
    private readonly driverEarningModel;
    private readonly driverPaymentModel;
    private configService;
    private readonly cloudinaryService;
    private readonly invoiceService;
    private readonly paymentService;
    constructor(userModel: PaginateModel<UserDocument>, rideModel: Model<RideDocument>, TemporyRideModel: Model<TemporaryRideDocument>, driverEarningModel: Model<DriverEarningDocument>, driverPaymentModel: Model<DriverPaymentDocument>, configService: ConfigService, cloudinaryService: CloudinaryService, invoiceService: InvoiceService, paymentService: PaymentService);
    private getDateFilter;
    seedSuperAdminData(): Promise<void>;
    getUsersDetails(): Promise<any[]>;
    createNewEntry(createNewEntryDto: CreateNewEntryDto, role?: UserRole): Promise<ApiResponse<{
        _id: Types.ObjectId;
    }>>;
    deleteEntry(deleteEntryDto: DeleteEntryDto, role?: UserRole): Promise<ApiResponse<unknown>>;
    updateEntry(updateEntryDto: UpdateEntryDto, role?: UserRole): Promise<ApiResponse<(mongoose.Document<unknown, {}, UserDocument, {}, {}> & User & Document & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }) | null>>;
    getAllRideDetails(): Promise<any[]>;
    getAllTemporaryRideDetails(): Promise<any[]>;
    getAllRideWithStatus(status: string): Promise<{
        status: string;
        rides: any[];
    }>;
    getRideInvoice(rideId: string): Promise<string | undefined>;
    getTotalEarning(filter: string): Promise<Buffer>;
    getNewUsers(filter: string): Promise<Buffer>;
    getNewRides(filter: string): Promise<Buffer>;
    processRefund(rideId: string): Promise<ApiResponse<{
        rideId: unknown;
        refundStatus: "refunded" | "partially_refunded";
        refundAmount: number;
        refundPercentage: number;
        paymentId: unknown;
    }>>;
    payAllDrivers(): Promise<{
        success: boolean;
        message: string;
        statusCode: number;
        data: any[];
    }>;
}
