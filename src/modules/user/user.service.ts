import { BadRequestException, HttpStatus, Injectable, NotAcceptableException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SignUpDto } from './dto/sign_up.user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { PendingUser, PendingUserDocument, User, UserDocument } from 'src/comman/schema/user.schema';
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
    private tokenService: TokenService,
    private cloudinaryService: CloudinaryService,
    private smsService: SmsService
  ) {}

  private async getPendingUser(contactNumber: number): Promise<PendingUserDocument | null> {
    return this.pendingUserModel.findOne({ contactNumber });
  }

  /** ---------------- SIGNUP ---------------- */
  async signUp(signUp: SignUpDto) {
    const existingUser = await this.userModel.findOne({ contactNumber: signUp.contactNumber });
    const pendingUser = await this.getPendingUser(signUp.contactNumber);
  console.log(existingUser || pendingUser);
  
    if (existingUser || pendingUser) {
      throw new BadRequestException("User already exists");
    }

    const hashedPassword = await bcrypt.hash(signUp.password, 10);
    const newUser = await this.pendingUserModel.create({ ...signUp, password: hashedPassword });

    const accessToken = await this.tokenService.generateAccessToken(newUser._id);
    const refreshToken = await this.tokenService.generateRefreshToken(newUser._id);
    newUser.refreshToken = refreshToken;
    await newUser.save();

    // Send verification OTP via SMS
    await this.sendUserVerificationOtp(newUser._id);

    const { password, ...userWithoutPassword } = newUser.toObject();
    return { message: "User created successfully", data: userWithoutPassword, accessToken, refreshToken };
  }

  /** ---------------- SEND OTP ---------------- */
  async sendUserVerificationOtp(userId: mongoose.Types.ObjectId) {
    const pendingUser = await this.pendingUserModel.findById(userId);
    if (!pendingUser) {
      throw new BadRequestException('User not found');
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    pendingUser.otp = otp;
    pendingUser.otpExpiresAt = otpExpiresAt;
    await pendingUser.save();

    // Send OTP via SMS
    await this.smsService.sendVerificationOtpSms(Number(otp));

    return { message: 'OTP sent successfully', otpSentTo: pendingUser.contactNumber };
  }

  /** ---------------- VERIFY OTP ---------------- */
  async userVerifiedUsingOtp(userId: mongoose.Types.ObjectId, otp: number) {
    const pendingUser = await this.pendingUserModel.findById(userId);
    if (!pendingUser) throw new BadRequestException('Pending user not found');

    if (pendingUser.otp !== otp.toString()) throw new BadRequestException('Invalid OTP');
    if (pendingUser.otpExpiresAt && pendingUser.otpExpiresAt < new Date()) throw new BadRequestException('OTP expired');

    const newUser = await this.userModel.create({
      name: pendingUser.name,
      contactNumber: pendingUser.contactNumber,
      password: pendingUser.password,
      role: pendingUser.role,
      refreshToken: pendingUser.refreshToken,
      isVerified: true,
      profilePic: pendingUser.profilePic,
      vehicleDetails: pendingUser.vehicleDetails,
      location: pendingUser.location,
      isContactNumberVerified: true,
    });

    await this.pendingUserModel.findByIdAndDelete(userId);

    const { password, ...userWithoutPassword } = newUser.toObject();
    return { message: 'User verified successfully', data: userWithoutPassword };
  }

  /** ---------------- LOGIN ---------------- */
  async login(loginDto: LoginDto) {
    const { contactNumber, password } = loginDto;
    if (!contactNumber || !password) throw new NotAcceptableException("Please enter contact Number and password");

    const user = await this.userModel.findOne({ contactNumber });
    if (!user) throw new NotAcceptableException("User not found");

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new NotAcceptableException("Invalid password");

    const accessToken = await this.tokenService.generateAccessToken(user._id);
    const refreshToken = await this.tokenService.generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    return { message: "User login successfully", data: user, accessToken, refreshToken };
  }

  async logout(userId: mongoose.Types.ObjectId) {
    await this.userModel.findByIdAndUpdate(userId, { $set: { refreshToken: '' } });
    return { message: "User logged out successfully" };
  }

  /** ---------------- UPLOAD PROFILE PIC ---------------- */
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
