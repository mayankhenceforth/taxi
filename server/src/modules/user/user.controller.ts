import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { SignUpDto } from './dto/sign_up.user.dto';
import mongoose from 'mongoose';
import { VerifyOtpDto } from './dto/otp.verification';
import { LoginDto } from './dto/login.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadInterceptor } from 'src/comman/inerceptors/file-upload.interceptor';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { ResetPasswordStep1Dto } from './dto/reset-password-step1.dto';
import { ResetPasswordStep2Dto } from './dto/reset-password-step2.dto';
import { ResetPasswordStep3Dto } from './dto/reset-password-step3.dto';
import { AuthGuards } from 'src/comman/guards/auth.guards';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post("sign-up")
  @ApiOperation({ summary: 'Register a new user', description: 'Creates a new user account with the provided details.' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 409, description: 'User already exists.' })
  signUpUser(@Body() signUpDto: SignUpDto) {
    return this.userService.signUp(signUpDto);
  }

  @Post('sendUserVerificationOtp')
  @ApiOperation({ summary: 'Send OTP for user verification', description: 'Sends a one-time password (OTP) to the user for account verification.' })
  @ApiQuery({ name: 'id', type: String, description: 'User ID (MongoDB ObjectId)' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async sendOtp(@Query('id') id: string) {
    const userId = new mongoose.Types.ObjectId(id);
    return this.userService.sendUserVerificationOtp(userId);
  }

  @Post('otpVerification')
  @ApiOperation({ summary: 'Verify user with OTP', description: 'Verifies the user account using the provided OTP.' })
  @ApiQuery({ name: 'id', type: String, description: 'User ID (MongoDB ObjectId)' })
  @ApiResponse({ status: 200, description: 'User verified successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid OTP.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async otpVerification(@Body() dto: VerifyOtpDto, @Query('id') id: string) {
    console.log("userId:",id)
    const userId = new mongoose.Types.ObjectId(id)

    console.log("user Mogodb id:",userId)
    return this.userService.userVerifiedUsingOtp(userId, dto.otp)
  }

  @Post('login')
  @ApiOperation({ summary: 'User login', description: 'Authenticates a user with their credentials.' })
  @ApiResponse({ status: 200, description: 'User logged in successfully.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(@Body() logindto: LoginDto) {
    return this.userService.login(logindto)
  }

  @Post("upload-profile")
  @UseInterceptors(UploadInterceptor())
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload user profile picture', description: 'Uploads a profile picture for the specified user.' })
  @ApiQuery({ name: 'id', type: String, description: 'User ID (MongoDB ObjectId)' })
  @ApiResponse({ status: 200, description: 'Profile picture uploaded successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid file or user ID.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  uploadProfilePic(@Req() request: Request, @UploadedFile() profilePicFile: Express.Multer.File, @Query('id') userId: string) {
    return this.userService.uploadProfilePic(userId, profilePicFile);
  }

 @UseGuards(AuthGuards) 
  @Delete('logout')
  async logout(@Req() request: Request) {
    const userId = (request as any)._id;
    return await this.userService.logout(new mongoose.Types.ObjectId(userId));
  }

  @Post("resetPasswordStep1")
 async reset_password_1st_step(@Body() resetPasswordStep1Dto:ResetPasswordStep1Dto){
    const {contactNumber} = resetPasswordStep1Dto
    return this.userService.resetPassword1step(contactNumber)
  }

  @Post("resetPasswordStep2")
  async reset_password_2nd_step(@Body() resetPasswordStep2Dto:ResetPasswordStep2Dto){
    const {contactNumber ,otp}= resetPasswordStep2Dto
    return this.userService.resetPassword2step(contactNumber,otp)
  }

  @Patch("resetPasswordStep3")
  async reset_password_3rd_step(@Body() resetPasswordStep3Dto:ResetPasswordStep3Dto){
    const{ contactNumber, newPassword} = resetPasswordStep3Dto
    return this.userService.resetPassword3step(contactNumber ,newPassword)
  }
}