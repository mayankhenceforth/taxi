import { Logger } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import mongoose, { Connection } from "mongoose";
import { Ride, RideDocument } from "../schema/ride.schema";
import { Model } from "mongoose";
import { User, UserDocument } from "../schema/user.schema";
import { Mode } from "fs";
import { DriverEarning, DriverEarningDocument } from "../schema/driver-earnings.schema";
import { DriverPayment, DriverPaymentDocument } from "../schema/DriverPaymentInfo.schema";
import { Payment, PaymentDocument } from "../schema/payment.schema";
import { DriverPayout } from "../schema/payout.schema";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Types } from "mongoose";



export class PaymentCronService {
    private readonly logger = new Logger(PaymentCronService.name)

    constructor(
        @InjectConnection() private readonly connection: Connection,
        @InjectModel(Ride.name) private readonly rideModel: Model<RideDocument>,
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        @InjectModel(DriverEarning.name) private readonly driverEarningModel: Model<DriverEarningDocument>,
        @InjectModel(DriverPayment.name) private readonly driverPaymentModel: Model<DriverPaymentDocument>,
        @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
        @InjectModel(DriverPayout.name) private readonly driverPayoutModel: Model<DriverPaymentDocument>
    ) { }
    @Cron('0 0 * * 0')
    async payoutDrivers() {
        console.log("payment cron start.....")
        const driverAggregates = await this.rideModel.aggregate([
            {
                $match: {
                    status: { $in: ["completed", "cancelled"] },
                    driverPaymentStatus: { $ne: "paid" }
                }
            },
            {
                $group: {
                    _id: "$driver",
                    totalEarnings: { $sum: "$driverEarnings" },
                    rides: {
                        $push: {
                            rideId: "$_id",
                            status: "$status",
                            driverEarnings: "$driverEarnings",
                            cancelledBy: "$cancelledBy"
                        }
                    }
                }
            }
        ]);

        console.log(driverAggregates)

        const results: Array<{
            driverId: any;
            message?: string;
            totalEarnings?: number;
            payoutMethod?: string;
            payoutAccount?: string;
            ridesPaid?: number;
            driverPayment?: any;
        }> = [];

        console.log("results:", results)

        for (const driver of driverAggregates) {
            if (!driver._id) continue;

            // Get driver's default payout account
            const payoutDetails = await this.driverPayoutModel.findOne({
                driverId: driver._id,
                isActive: true,
                isDefault: true
            });

            if (!payoutDetails) {
                results.push({
                    driverId: driver._id,
                    message: "No payout details found, skipped",
                    totalEarnings: driver.balance
                });
                continue;
            }

            // 2️⃣ Update driver earnings documents
            const earning = await this.driverEarningModel.updateMany(
                { driverId: driver._id, driverPaymentStatus: "unpaid" },
                { $set: { driverPaymentStatus: "paid", updatedAt: new Date() } }
            );
            console.log(earning)
            // 3️⃣ Update ride documents
            await this.rideModel.updateMany(
                { _id: { $in: driver.rides.map((r: any) => r.rideId) } },
                { $set: { driverPaymentStatus: "paid" } }
            );

            // 4️⃣ Update or create DriverPayment document
            const driverPayment = await this.driverPaymentModel.findOneAndUpdate(
                { driverId: driver._id },
                {
                    $set: {
                        payoutMethod: payoutDetails._id,
                        balance: 0,
                        status: "paid",
                        lastPayoutAmount: driver.balance,
                        lastPayoutDate: new Date(),
                        payoutTransactionId: new Types.ObjectId().toString(),
                        remarks: "Payout processed successfully"
                    },
                    $inc: {
                        totalEarnings: driver.balance // increment totalEarnings by current payout
                    }
                },
                { upsert: true, new: true }
            );

            // Push summary
            results.push({
                driverId: driver._id,
                totalEarnings: driver.totalEarnings,
                //    payoutMethod: payoutDetails.method,
                //    payoutAccount: payoutDetails.accountNumber,
                ridesPaid: driver.rides.length,
                driverPayment
            });
        }

        return {
            success: true,
            message: "Driver payouts processed",
            statusCode: 200,
            data: results
        };
    }
}
