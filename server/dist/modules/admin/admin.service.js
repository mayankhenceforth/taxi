"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const api_response_1 = require("../../comman/helpers/api-response");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const user_schema_1 = require("../../comman/schema/user.schema");
const mongoose_2 = require("mongoose");
const role_enum_1 = require("../../comman/enums/role.enum");
const ride_schema_1 = require("../../comman/schema/ride.schema");
const number_to_words_1 = require("number-to-words");
const puppeteer = require("puppeteer");
const QRCode = require("qrcode");
const cloudinary_service_1 = require("../../comman/cloudinary/cloudinary.service");
let AdminService = class AdminService {
    userModel;
    rideModel;
    TemporyRideModel;
    configService;
    cloudinaryService;
    constructor(userModel, rideModel, TemporyRideModel, configService, cloudinaryService) {
        this.userModel = userModel;
        this.rideModel = rideModel;
        this.TemporyRideModel = TemporyRideModel;
        this.configService = configService;
        this.cloudinaryService = cloudinaryService;
    }
    getDateFilter(filter) {
        const now = new Date();
        switch (filter) {
            case 'last_hour':
                return new Date(now.getTime() - 60 * 60 * 1000);
            case '1_day':
                return new Date(now.getTime() - 24 * 60 * 60 * 1000);
            case '10_days':
                return new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
            case '1_month':
                return new Date(now.setMonth(now.getMonth() - 1));
            default:
                throw new common_1.BadRequestException('Invalid filter');
        }
    }
    async seedSuperAdminData() {
        try {
            const contact = this.configService.get('SUPER_ADMIN_CONTACT');
            const password = this.configService.get('SUPER_ADMIN_PASSWORD');
            if (!contact || !password) {
                throw new Error('Super admin credentials not set in environment variables');
            }
            const isAlreadyExisting = await this.userModel.findOne({
                contactNumber: contact,
            });
            if (!isAlreadyExisting) {
                const hashedPassword = await bcrypt.hash(password, 10);
                const superAdmin = new this.userModel({
                    name: 'Super Admin',
                    contactNumber: contact,
                    password: hashedPassword,
                    role: 'super-admin',
                    isContactNumberVerified: true,
                });
                await superAdmin.save();
                console.log('Super admin seeded successfully');
            }
        }
        catch (error) {
            console.error(`Error occurred while seeding the admin data: ${error}`);
        }
    }
    async getUsersDetails() {
        return await this.userModel.aggregate([
            {
                $match: {
                    role: { $in: [role_enum_1.Role.User, role_enum_1.Role.Driver] }
                }
            },
            {
                $group: {
                    _id: "$role",
                    users: { $push: "$$ROOT" }
                }
            },
            {
                $project: {
                    role: "$_id",
                    users: 1,
                    _id: 0
                }
            }
        ]);
    }
    async createNewEntry(createNewEntryDto, role = 'user') {
        const existingUser = await this.userModel.findOne({
            contactNumber: createNewEntryDto.contactNumber,
        });
        if (existingUser) {
            throw new common_1.HttpException('A user already exists with the same contact number!', common_1.HttpStatus.BAD_REQUEST);
        }
        if (createNewEntryDto.password) {
            createNewEntryDto.password = await bcrypt.hash(createNewEntryDto.password, 10);
        }
        const newEntry = new this.userModel({
            ...createNewEntryDto,
            role,
            isContactNumberVerified: true,
        });
        await newEntry.save();
        const roleInSentenceCase = role.charAt(0).toUpperCase() + role.slice(1);
        return new api_response_1.default(true, `${roleInSentenceCase} created successfully!`, common_1.HttpStatus.CREATED, { _id: newEntry._id });
    }
    async deleteEntry(deleteEntryDto, role = 'admin') {
        const id = new mongoose_2.Types.ObjectId(deleteEntryDto?._id);
        const existingUser = await this.userModel.findOne({ _id: id, role });
        const roleInSentenceCase = role.charAt(0).toUpperCase() + role.slice(1);
        if (!existingUser) {
            throw new common_1.HttpException(`${roleInSentenceCase} doesn't exist!`, common_1.HttpStatus.BAD_REQUEST);
        }
        await this.userModel.findByIdAndDelete(id);
        return new api_response_1.default(true, `${roleInSentenceCase} deleted successfully!`, common_1.HttpStatus.OK);
    }
    async updateEntry(updateEntryDto, role = 'user') {
        const id = new mongoose_2.Types.ObjectId(updateEntryDto?._id);
        const existingUser = await this.userModel.findOne({ _id: id, role });
        const roleInSentenceCase = role.charAt(0).toUpperCase() + role.slice(1);
        if (!existingUser) {
            throw new common_1.HttpException(`${roleInSentenceCase} doesn't exist!`, common_1.HttpStatus.BAD_REQUEST);
        }
        if (updateEntryDto.password) {
            updateEntryDto.password = await bcrypt.hash(updateEntryDto.password, 10);
        }
        const updatedEntry = await this.userModel
            .findByIdAndUpdate(id, { $set: { ...updateEntryDto } }, { new: true })
            .select('_id name contactNumber profilePic profilePicPublicId isContactNumberVerified role');
        return new api_response_1.default(true, `${roleInSentenceCase} updated successfully!`, common_1.HttpStatus.OK, updatedEntry);
    }
    async getAllRideDetails() {
        return await this.rideModel.aggregate([
            {
                $group: {
                    _id: "$status",
                    rides: { $push: "$$ROOT" }
                }
            }
        ]);
    }
    async getAllTemporaryRideDetails() {
        return await this.TemporyRideModel.aggregate([
            {
                $group: {
                    _id: "$status",
                    rides: { $push: "$$ROOT" }
                }
            }
        ]);
    }
    async getAllRideWithStatus(status) {
        if (!status) {
            throw new common_1.HttpException('Status is required', common_1.HttpStatus.BAD_REQUEST);
        }
        const allowedStatuses = ['pending', 'accepted', 'completed', 'cancelled'];
        if (!allowedStatuses.includes(status)) {
            throw new common_1.HttpException(`Invalid status provided. Allowed values are: ${allowedStatuses.join(', ')}`, common_1.HttpStatus.BAD_REQUEST);
        }
        const rides = await this.rideModel.aggregate([
            { $match: { status } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'bookedBy',
                    foreignField: '_id',
                    as: 'bookedBy'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'driver',
                    foreignField: '_id',
                    as: 'driver'
                }
            },
            {
                $project: {
                    _id: 1,
                    status: 1,
                    bookedBy: 1,
                    driver: 1,
                    pickupLocation: 1,
                    dropLocation: 1,
                    totalFare: 1,
                    cancelReason: 1,
                    cancelledBy: 1,
                    paymentStatus: 1,
                    refundStatus: 1
                }
            }
        ]);
        return {
            status,
            rides
        };
    }
    async getRideInvoice(rideId) {
        if (!rideId) {
            throw new common_1.HttpException('Ride ID is required', common_1.HttpStatus.BAD_REQUEST);
        }
        const ride = await this.rideModel.findById(rideId);
        if (!ride) {
            throw new common_1.HttpException('Ride not found', common_1.HttpStatus.NOT_FOUND);
        }
        return ride.invoiceUrl;
    }
    async getTotalEarning(filter) {
        const fromDate = this.getDateFilter(filter);
        const result = await this.rideModel.aggregate([
            { $match: { status: 'completed', createdAt: { $gte: fromDate } } },
            {
                $group: {
                    _id: null,
                    totalEarning: { $sum: "$totalFare" },
                    rides: { $push: "$$ROOT" }
                }
            }
        ]);
        return result[0] || { totalEarning: 0, rides: [] };
    }
    async generateEarningInvoice(filter) {
        const data = await this.getTotalEarning(filter);
        const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background: #f0f0f0; }
        </style>
      </head>
      <body>
        <h2>Taxi App Earnings Report</h2>
        <p>Filter: <strong>${filter}</strong></p>
        <p>Total Earnings: <strong>$${data.totalEarning}</strong> (${(0, number_to_words_1.toWords)(data.totalEarning)})</p>

        <table>
          <thead>
            <tr>
              <th>Ride ID</th>
              <th>User</th>
              <th>Driver</th>
              <th>Fare</th>
              <th>Pickup</th>
              <th>Drop</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${data.rides.map(ride => `
              <tr>
                <td>${ride._id}</td>
                <td>${ride.bookedBy}</td>
                <td>${ride.driver}</td>
                <td>${ride.totalFare}</td>
                <td>${ride.pickupLocation}</td>
                <td>${ride.dropLocation}</td>
                <td>${new Date(ride.createdAt).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfUint8Array = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
        });
        await browser.close();
        const pdfBuffer = Buffer.from(pdfUint8Array);
        const uploadResult = await this.cloudinaryService.uploadFile({
            buffer: pdfBuffer,
            originalname: `earning_invoice_${filter}.pdf`
        });
        if (!uploadResult || !uploadResult.secure_url) {
            throw new common_1.HttpException('Failed to upload invoice to Cloudinary', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return uploadResult.secure_url;
    }
    async generateQRCode(ride) {
        const qrText = `Ride ID: ${ride._id}\nUser: ${ride.bookedBy}\nDriver: ${ride.driver}\nFare: ₹${ride.totalFare}\nDate: ${new Date(ride.createdAt).toLocaleDateString()}`;
        return await QRCode.toDataURL(qrText, { width: 100, margin: 2, color: { dark: '#fcad02', light: '#ffffff' } });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(ride_schema_1.Ride.name)),
    __param(2, (0, mongoose_1.InjectModel)(ride_schema_1.TemporaryRide.name)),
    __metadata("design:paramtypes", [Object, mongoose_2.Model,
        mongoose_2.Model,
        config_1.ConfigService,
        cloudinary_service_1.CloudinaryService])
], AdminService);
//# sourceMappingURL=admin.service.js.map