import { 
  BadRequestException, 
  HttpStatus, 
  Injectable, 
  NotAcceptableException, 
  NotFoundException, 
  UnauthorizedException 
} from '@nestjs/common';
import { SignUpDto } from './dto/sign_up.user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { 
  PendingUser, 
  PendingUserDocument, 
  User, 
  UserDocument,
  DriverLicense,
  DriverLicenseDocument,
  VehicleDetails,
  VehicleDetailsDocument
} from 'src/comman/schema/user.schema';
import mongoose, { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { TokenService } from 'src/comman/token/token.service';
import * as crypto from 'crypto';
import { LoginDto } from './dto/login.dto';
import ApiResponse from 'src/comman/helpers/api-response';
import { CloudinaryService } from 'src/comman/cloudinary/cloudinary.service';
import { SmsService } from 'src/comman/sms/sms.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(PendingUser.name) private pendingUserModel: Model<PendingUserDocument>,
    @InjectModel(DriverLicense.name) private driverLicenseModel: Model<DriverLicenseDocument>,
    @InjectModel(VehicleDetails.name) private vehicleDetailsModel: Model<VehicleDetailsDocument>,
    private tokenService: TokenService,
    private cloudinaryService: CloudinaryService,
    private smsService: SmsService
  ) {}

  private async getPendingUser(contactNumber: string): Promise<PendingUserDocument | null> {
    return this.pendingUserModel.findOne({ contactNumber }).exec();
  }

  async signUp(signUp: SignUpDto) {
    console.log(signUp);
    const fullContactNumber = signUp.countryCode + signUp.contactNumber;

    const existingUser = await this.userModel.findOne({ contactNumber: fullContactNumber }).exec();
    const pendingUser = await this.getPendingUser(fullContactNumber);

    if (existingUser || pendingUser) {
      throw new BadRequestException("User already exists");
    }

    const hashedPassword = await bcrypt.hash(signUp.password, 10);

    // Base user data without driverLicense and vehicleDetails
    const userData: any = {
      name: signUp.name,
      contactNumber: fullContactNumber,
      password: hashedPassword,
      role: signUp.role,
      email: signUp.email,
      isContactNumberVerified: false,
      isVerified: false,
      profilePic: signUp.profilePic,
    };

    if (signUp.role === 'driver') {
      // Validate required driver fields
      if (!signUp.driverLicenseNumber) throw new BadRequestException('Driver license number is required');
      if (!signUp.licenseIssueDate) throw new BadRequestException('License issue date is required');
      if (!signUp.licenseExpiryDate) throw new BadRequestException('License expiry date is required');
      if (!signUp.issuingAuthority) throw new BadRequestException('Issuing authority is required');
      if (!signUp.vehicleNumberPlate) throw new BadRequestException('Vehicle number plate is required');
      if (!signUp.vehicleType) throw new BadRequestException('Vehicle type is required');
      if (!signUp.vehicleModel) throw new BadRequestException('Vehicle model is required');
      if (!signUp.coordinates) throw new BadRequestException('Location coordinates are required');

      // Convert number plate to uppercase
      const uppercaseNumberPlate = signUp.vehicleNumberPlate.toUpperCase();

      // Check if driver license already exists
      const existingLicense = await this.driverLicenseModel.findOne({ licenseNumber: signUp.driverLicenseNumber }).exec();
      if (existingLicense) {
        throw new BadRequestException('Driver license number already exists');
      }

      // Check if vehicle already exists
      const existingVehicle = await this.vehicleDetailsModel.findOne({ numberPlate: uppercaseNumberPlate }).exec();
      if (existingVehicle) {
        throw new BadRequestException('Vehicle number plate already exists');
      }

      // Assign driverLicense and vehicleDetails only here
      userData.driverLicense = {
        licenseNumber: signUp.driverLicenseNumber,
        issueDate: new Date(signUp.licenseIssueDate),
        expiryDate: new Date(signUp.licenseExpiryDate),
        issuingAuthority: signUp.issuingAuthority,
        isVerified: false,
      };

      userData.vehicleDetails = {
        numberPlate: uppercaseNumberPlate,
        type: signUp.vehicleType,
        model: signUp.vehicleModel,
      };

      userData.location = {
        type: 'Point',
        coordinates: signUp.coordinates,
      };
    }

    const newUser = await this.pendingUserModel.create(userData);

    const accessToken = await this.tokenService.generateAccessToken(newUser._id);
    const refreshToken = await this.tokenService.generateRefreshToken(newUser._id);

    newUser.refreshToken = refreshToken;
    await newUser.save();

    await this.sendUserVerificationOtp(newUser._id);

    const { password, ...userWithoutPassword } = newUser.toObject();
    return {
      message: "User created successfully",
      data: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async sendUserVerificationOtp(userId: mongoose.Types.ObjectId) {
    const pendingUser = await this.pendingUserModel.findById(userId).exec();
    if (!pendingUser) {
      throw new BadRequestException('User not found');
    }

    const otp = crypto.randomInt(100000, 999999);
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    pendingUser.otp = otp;
    pendingUser.otpExpiresAt = otpExpiresAt;
    await pendingUser.save();

    await this.smsService.sendVerificationOtpSms(otp);

    return {
      message: 'OTP sent successfully',
      otpSentTo: pendingUser.contactNumber,
    };
  }

  async userVerifiedUsingOtp(userId: mongoose.Types.ObjectId, otp: number) {
    console.log("user vefification")
   

  const pendingUser = await this.pendingUserModel.findById(userId).exec();
  if (!pendingUser) throw new BadRequestException('Pending user not found');

  if (pendingUser.otp !== otp) throw new BadRequestException('Invalid OTP');

  if (pendingUser.otpExpiresAt && pendingUser.otpExpiresAt < new Date())
    throw new BadRequestException('OTP expired');

  const userData: any = {
    name: pendingUser.name,
    contactNumber: pendingUser.contactNumber,
    password: pendingUser.password,
    role: pendingUser.role,
    refreshToken: pendingUser.refreshToken,
    isVerified: true,
    profilePic: pendingUser.profilePic,
    isContactNumberVerified: true,
    email: pendingUser.email,
    location: pendingUser.location,
    
  };

  if (pendingUser.role === 'driver' && pendingUser.driverLicense && pendingUser.vehicleDetails) {
    // Create DriverLicense and VehicleDetails documents if not already existing
        console.log("vehicale",pendingUser.vehicleDetails.model)
            console.log("License",pendingUser.driverLicense.licenseNumber)
    const [existingLicense, existingVehicle] = await Promise.all([
      this.driverLicenseModel.findOne({ licenseNumber: pendingUser.driverLicense.licenseNumber }),
      this.vehicleDetailsModel.findOne({ numberPlate: pendingUser.vehicleDetails.numberPlate.toUpperCase() }),
    ]);

    if (existingLicense) {
      userData.driverLicense = existingLicense._id;
    } else {
      const driverLicenseDoc = await this.driverLicenseModel.create({
        licenseNumber: pendingUser.driverLicense.licenseNumber,
        issueDate: pendingUser.driverLicense.issueDate,
        expiryDate: pendingUser.driverLicense.expiryDate,
        issuingAuthority: pendingUser.driverLicense.issuingAuthority,
        isVerified: false,
      });
      userData.driverLicense = driverLicenseDoc._id;
    }

    if (existingVehicle) {
      userData.vehicleDetails = existingVehicle._id;
    } else {
      console.log("vehicale",pendingUser.vehicleDetails.model)
      const vehicleDetailsDoc = await this.vehicleDetailsModel.create({
        numberPlate: pendingUser.vehicleDetails.numberPlate.toUpperCase(),
        type: pendingUser.vehicleDetails.type,
        model: pendingUser.vehicleDetails.model,
      });
      userData.vehicleDetails = vehicleDetailsDoc._id;
    }
  }

  const newUser = await this.userModel.create(userData);
  await this.pendingUserModel.findByIdAndDelete(userId).exec();

  const { password, ...userWithoutPassword } = newUser.toObject();
  return {
    message: 'User verified successfully',
    data: userWithoutPassword,
  };
}


  async login(loginDto: LoginDto) {
    const { contactNumber, password } = loginDto;
    if (!contactNumber || !password) {
      throw new NotAcceptableException("Please enter contact Number and password");
    }

    const user = await this.userModel.findOne({ contactNumber })
      .populate('driverLicense')
      .populate('vehicleDetails')
      .exec();

    if (!user) throw new NotAcceptableException("User not found");

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new NotAcceptableException("Invalid password");

    const accessToken = await this.tokenService.generateAccessToken(user._id);
    const refreshToken = await this.tokenService.generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    const { password: _, ...userWithoutPassword } = user.toObject();

    return {
      message: "User login successfully",
      data: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: mongoose.Types.ObjectId) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new UnauthorizedException("User not found");

    user.refreshToken = '';
    await user.save();

     return new ApiResponse(true, 'Ride created successfully!', HttpStatus.OK);
  }

 async uploadProfilePic(userid, profilePicFile: Express.Multer.File): Promise<ApiResponse<string>> {
    if (!profilePicFile) throw new NotFoundException("Oops! Please check ProfilePic field");

    const existUser = await this.userModel.findById(userid);
    if (!existUser) throw new UnauthorizedException("User not Found");

    const cloudFile = await this.cloudinaryService.uploadFile(profilePicFile);
    if (!cloudFile) throw new Error('Cloudinary upload failed');

    existUser.profilePic = cloudFile.secure_url;
    await existUser.save();

    return {
      success: true,
      statusCode: 200,
      message: 'Profile picture uploaded successfully',
      data: cloudFile.secure_url,
    };
  }
}
