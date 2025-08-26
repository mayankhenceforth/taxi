import { SetupDriverAccountDto } from './dto/SetupDriverAccount.dto';
import { User, UserDocument, VehicleDetailsDocument } from 'src/comman/schema/user.schema';
import { Model, Types } from 'mongoose';
import { CreateDriverPayoutDto } from './dto/CreatePaymentAccount.dto';
import { DriverPayout, DriverPayoutDocument } from 'src/comman/schema/payout.schema';
import { DriverEarning, DriverEarningDocument } from 'src/comman/schema/driver-earnings.schema';
import { DriverPayment, DriverPaymentDocument } from 'src/comman/schema/DriverPaymentInfo.schema';
import { RideDocument } from 'src/comman/schema/ride.schema';
export declare class DriverService {
    private readonly userModel;
    private readonly vehicleDetailsModel;
    private readonly driverPayoutModel;
    private readonly earningModel;
    private driverPaymentModel;
    private readonly rideModel;
    private readonly driverEarningModel;
    constructor(userModel: Model<UserDocument>, vehicleDetailsModel: Model<VehicleDetailsDocument>, driverPayoutModel: Model<DriverPayoutDocument>, earningModel: Model<DriverEarningDocument>, driverPaymentModel: Model<DriverPaymentDocument>, rideModel: Model<RideDocument>, driverEarningModel: Model<DriverEarningDocument>);
    setupDriverAccount(req: any, setupDriverAccountDto: SetupDriverAccountDto): Promise<{
        message: string;
        data: (import("mongoose").Document<unknown, {}, UserDocument, {}, {}> & User & Document & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        }) | null;
    }>;
    createPaymentAccount(req: any, dto: CreateDriverPayoutDto): Promise<{
        success: boolean;
        message: string;
        data: import("mongoose").Document<unknown, {}, DriverPayoutDocument, {}, {}> & DriverPayout & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        };
    }>;
    recordDriverEarning(rideId: string, driverId: Types.ObjectId, userId: Types.ObjectId, paymentId: Types.ObjectId | string, amount: number, rideStatus: string): Promise<import("mongoose").Document<unknown, {}, DriverEarningDocument, {}, {}> & DriverEarning & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    payDriver(driverId: string, rides: RideDocument[], payoutDetails: any): Promise<import("mongoose").Document<unknown, {}, DriverPaymentDocument, {}, {}> & DriverPayment & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    getDriverEarningsHistory(req: any, page?: number, limit?: number): Promise<{
        success: boolean;
        message: string;
        data: {
            earnings: (import("mongoose").Document<unknown, {}, DriverEarningDocument, {}, {}> & DriverEarning & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
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
    getDriverEarnings(req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
}
