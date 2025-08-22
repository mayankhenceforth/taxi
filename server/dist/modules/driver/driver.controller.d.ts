import { DriverService } from './driver.service';
import { SetupDriverAccountDto } from './dto/SetupDriverAccount.dto';
import { CreateDriverPayoutDto } from './dto/CreatePaymentAccount.dt.o';
export declare class DriverController {
    private readonly driverService;
    constructor(driverService: DriverService);
    setupDriverAccount(req: any, setupDriverAccountDto: SetupDriverAccountDto): Promise<{
        message: string;
        data: (import("mongoose").Document<unknown, {}, import("../../comman/schema/user.schema").UserDocument, {}, {}> & import("../../comman/schema/user.schema").User & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        }) | null;
    }>;
    createPayoutAccount(req: any, createDriverPayoutDto: CreateDriverPayoutDto): Promise<{
        success: boolean;
        message: string;
        data: import("mongoose").Document<unknown, {}, import("../../comman/schema/payout.schema").DriverPayoutDocument, {}, {}> & import("../../comman/schema/payout.schema").DriverPayout & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        };
    }>;
    getDriverEarnings(req: any): Promise<void>;
}
