import { SetupDriverAccountDto } from './dto/SetupDriverAccount.dto';
import { User, UserDocument, VehicleDetailsDocument } from 'src/comman/schema/user.schema';
import { Model } from 'mongoose';
export declare class DriverService {
    private readonly userModel;
    private readonly vehicleDetailsModel;
    constructor(userModel: Model<UserDocument>, vehicleDetailsModel: Model<VehicleDetailsDocument>);
    setupDriverAccount(req: any, setupDriverAccountDto: SetupDriverAccountDto): Promise<{
        message: string;
        data: (import("mongoose").Document<unknown, {}, UserDocument, {}, {}> & User & Document & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        }) | null;
    }>;
}
