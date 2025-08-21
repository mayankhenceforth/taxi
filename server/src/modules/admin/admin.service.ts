import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { GetUsersDto } from './dto/get-users.dto';
import ApiResponse from 'src/comman/helpers/api-response';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { CreateNewEntryDto } from './dto/create-admin.dto';
import { DeleteEntryDto } from './dto/delete-entry.dto';
import { UpdateEntryDto } from './dto/update-admin.dto';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from 'src/comman/schema/user.schema';
import { Model, PaginateModel, Types } from 'mongoose';
import { Role } from 'src/comman/enums/role.enum';
import { Ride, RideDocument, TemporaryRide, TemporaryRideDocument } from 'src/comman/schema/ride.schema';
import { toWords } from 'number-to-words';
import * as puppeteer from 'puppeteer';
import * as QRCode from 'qrcode';
import { CloudinaryService } from 'src/comman/cloudinary/cloudinary.service';
export type UserRole = 'super-admin' | 'admin' | 'user';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name)
    private userModel: PaginateModel<UserDocument>,
    @InjectModel(Ride.name) private readonly rideModel: Model<RideDocument>,
    @InjectModel(TemporaryRide.name) private readonly TemporyRideModel: Model<TemporaryRideDocument>,

    private configService: ConfigService,
    private readonly cloudinaryService: CloudinaryService, // 
  ) { }

  private getDateFilter(filter: string): Date {
    const now = new Date();
    switch(filter){
      case 'last_hour':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case '1_day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '10_days':
        return new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
      case '1_month':
        return new Date(now.setMonth(now.getMonth() - 1));
      default:
        throw new BadRequestException('Invalid filter');
    }
  }

  /** Seed the default super-admin account if not present */
  async seedSuperAdminData() {
    try {
      const contact = this.configService.get<string>('SUPER_ADMIN_CONTACT');
      const password = this.configService.get<string>('SUPER_ADMIN_PASSWORD');

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
    } catch (error) {
      console.error(`Error occurred while seeding the admin data: ${error}`);
    }
  }

  /** Get paginated list of users */
  async getUsersDetails() {
    return await this.userModel.aggregate([
      {
        $match: {
          role: { $in: [Role.User, Role.Driver] }
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


  /** Create a new admin or user */
  async createNewEntry(
    createNewEntryDto: CreateNewEntryDto,
    role: UserRole = 'user',
  ) {
    const existingUser = await this.userModel.findOne({
      contactNumber: createNewEntryDto.contactNumber,
    });

    if (existingUser) {
      throw new HttpException(
        'A user already exists with the same contact number!',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Hash password if provided
    if (createNewEntryDto.password) {
      createNewEntryDto.password = await bcrypt.hash(
        createNewEntryDto.password,
        10,
      );
    }

    const newEntry = new this.userModel({
      ...createNewEntryDto,
      role,
      isContactNumberVerified: true,
    });

    await newEntry.save();

    const roleInSentenceCase = role.charAt(0).toUpperCase() + role.slice(1);

    return new ApiResponse(
      true,
      `${roleInSentenceCase} created successfully!`,
      HttpStatus.CREATED,
      { _id: newEntry._id },
    );
  }

  /** Delete an entry by role */
  async deleteEntry(
    deleteEntryDto: DeleteEntryDto,
    role: UserRole = 'admin',
  ) {
    const id = new Types.ObjectId(deleteEntryDto?._id);

    const existingUser = await this.userModel.findOne({ _id: id, role });

    const roleInSentenceCase = role.charAt(0).toUpperCase() + role.slice(1);

    if (!existingUser) {
      throw new HttpException(
        `${roleInSentenceCase} doesn't exist!`,
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.userModel.findByIdAndDelete(id);

    return new ApiResponse(
      true,
      `${roleInSentenceCase} deleted successfully!`,
      HttpStatus.OK,
    );
  }

  /** Update an entry by role */
  async updateEntry(
    updateEntryDto: UpdateEntryDto,
    role: UserRole = 'user',
  ) {
    const id = new Types.ObjectId(updateEntryDto?._id);

    const existingUser = await this.userModel.findOne({ _id: id, role });

    const roleInSentenceCase = role.charAt(0).toUpperCase() + role.slice(1);

    if (!existingUser) {
      throw new HttpException(
        `${roleInSentenceCase} doesn't exist!`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Hash password if updating it
    if (updateEntryDto.password) {
      updateEntryDto.password = await bcrypt.hash(
        updateEntryDto.password,
        10,
      );
    }

    const updatedEntry = await this.userModel
      .findByIdAndUpdate(
        id,
        { $set: { ...updateEntryDto } },
        { new: true },
      )
      .select(
        '_id name contactNumber profilePic profilePicPublicId isContactNumberVerified role',
      );

    return new ApiResponse(
      true,
      `${roleInSentenceCase} updated successfully!`,
      HttpStatus.OK,
      updatedEntry,
    );
  }

  async getAllRideDetails() {

    return await this.rideModel.aggregate([
      {
        $group: {
          _id: "$status",
          rides: { $push: "$$ROOT" }
        }
      }
    ])

  }

  async getAllTemporaryRideDetails() {
    return await this.TemporyRideModel.aggregate([
      {
        $group: {
          _id: "$status",
          rides: { $push: "$$ROOT" }
        }
      }
    ])
  }

  async getAllRideWithStatus(status: string) {
  if (!status) {
    throw new HttpException('Status is required', HttpStatus.BAD_REQUEST);
  }

  const allowedStatuses = ['pending', 'accepted', 'completed', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    throw new HttpException(
      `Invalid status provided. Allowed values are: ${allowedStatuses.join(', ')}`,
      HttpStatus.BAD_REQUEST
    );
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
        refundStatus:1
      }
    }
  ]);

  return {
    status,
    rides
  };
}

async getRideInvoice(rideId: string) {
  if (!rideId) {
    throw new HttpException('Ride ID is required', HttpStatus.BAD_REQUEST);
  }

  const ride = await this.rideModel.findById(rideId)

  if (!ride) {
    throw new HttpException('Ride not found', HttpStatus.NOT_FOUND);
  }

  return ride.invoiceUrl
}

async getTotalEarning(filter: string) {
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

 async generateEarningInvoice(filter: string): Promise<string> {
  // Fetch earnings and rides data
  const data = await this.getTotalEarning(filter);

  // Create simple HTML for PDF
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
        <p>Total Earnings: <strong>$${data.totalEarning}</strong> (${toWords(data.totalEarning)})</p>

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

  // Generate PDF using Puppeteer
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // safe for some servers
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfUint8Array = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
  });

  await browser.close();

  // Convert to Buffer for Node.js
  const pdfBuffer = Buffer.from(pdfUint8Array);

  // Upload to Cloudinary
  const uploadResult = await this.cloudinaryService.uploadFile({
    buffer: pdfBuffer,
    originalname: `earning_invoice_${filter}.pdf`
  });
  if (!uploadResult || !uploadResult.secure_url) {
    throw new HttpException('Failed to upload invoice to Cloudinary', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  return uploadResult.secure_url;
}


  private async generateQRCode(ride: any): Promise<string> {
    const qrText = `Ride ID: ${ride._id}\nUser: ${ride.bookedBy}\nDriver: ${ride.driver}\nFare: ₹${ride.totalFare}\nDate: ${new Date(ride.createdAt).toLocaleDateString()}`;
    return await QRCode.toDataURL(qrText, { width: 100, margin: 2, color: { dark: '#fcad02', light: '#ffffff' } });
  }
}
