import { SetupDriverAccountDto } from './dto/SetupDriverAccount.dto';
import { DriverService } from './driver.service';
export declare class DriverController {
    private readonly driverService;
    constructor(driverService: DriverService);
    setupDriverAccount(request: any, setupDriverAccountDto: SetupDriverAccountDto): Promise<{
        message: string;
        data: (import("mongoose").Document<unknown, {}, import("../../comman/schema/user.schema").UserDocument, {}, {}> & import("../../comman/schema/user.schema").User & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        }) | null;
    }>;
}
