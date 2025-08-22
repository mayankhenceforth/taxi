import { SetupDriverAccountDto } from './dto/SetupDriverAccount.dto';
import { User, UserDocument, VehicleDetailsDocument } from 'src/comman/schema/user.schema';
import { Model, Types } from 'mongoose';
import { CreateDriverPayoutDto } from './dto/CreatePaymentAccount.dto';
import { DriverPayout, DriverPayoutDocument } from 'src/comman/schema/payout.schema';
import { DriverEarnings, DriverEarningsDocument } from 'src/comman/schema/driver-earnings.schema';
export declare class DriverService {
    private readonly userModel;
    private readonly vehicleDetailsModel;
    private readonly DriverPayOutModel;
    private readonly earningModel;
    constructor(userModel: Model<UserDocument>, vehicleDetailsModel: Model<VehicleDetailsDocument>, DriverPayOutModel: Model<DriverPayoutDocument>, earningModel: Model<DriverEarningsDocument>);
    setupDriverAccount(req: any, setupDriverAccountDto: SetupDriverAccountDto): Promise<{
        message: string;
        data: (import("mongoose").Document<unknown, {}, UserDocument, {}, {}> & User & Document & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        }) | null;
    }>;
    createPaymentAccount(req: any, createDriverPayoutDto: CreateDriverPayoutDto): Promise<{
        success: boolean;
        message: string;
        data: import("mongoose").Document<unknown, {}, DriverPayoutDocument, {}, {}> & DriverPayout & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        };
    }>;
    updateDriverEarnings(rideId: Types.ObjectId, driverId: Types.ObjectId, amount: number): Promise<import("mongoose").Document<unknown, {}, DriverEarningsDocument, {}, {}> & DriverEarnings & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    getDriverEarnings(req: any): Promise<{
        success: boolean;
        message: string;
        data: import("mongoose").Document<unknown, {}, DriverEarningsDocument, {}, {}> & DriverEarnings & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        };
    }>;
    getDriverEarningsHistory(req: any, page?: number, limit?: number): Promise<{
        success: boolean;
        message: string;
        data: {
            earnings: (import("mongoose").Document<unknown, {}, DriverEarningsDocument, {}, {}> & DriverEarnings & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
                _id: unknown;
            }> & {
                __v: number;
            })[];
            pagination: {
                currentPage: number;
                totalPages: number;
                totalItems: number;
                itemsPerPage: number;
            };
        };
    }>;
}
