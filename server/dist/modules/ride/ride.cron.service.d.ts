import { Model } from 'mongoose';
import { RideDocument, TemporaryRideDocument } from 'src/comman/schema/ride.schema';
export declare class RideCronService {
    private tempRideModel;
    private rideModel;
    private readonly logger;
    constructor(tempRideModel: Model<TemporaryRideDocument>, rideModel: Model<RideDocument>);
    checkPendingRides(): Promise<void>;
    checkRideStart(): Promise<void>;
}
