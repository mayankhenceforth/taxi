import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { SignUpDto } from './dto/sign_up.user.dto';
import mongoose from 'mongoose';
import { VerifyOtpDto } from './dto/otp.verification';
import { LoginDto } from './dto/login.dto';


@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post("sign-up")
  signUpUser(@Body() signUpDto: SignUpDto) {
    return this.userService.signUp(signUpDto);
  }

  @Post('sendUserVerificationOtp')
  async sendOtp(@Query('id') id: string) {
    const userId = new mongoose.Types.ObjectId(id);
    return this.userService.sendUserVerificationOtp(userId);
  }

  @Post('otpVerification')
  async otpVerification(@Body() dto: VerifyOtpDto, @Query('id') id: string) {
    const userId = new mongoose.Types.ObjectId(id)
    return this.userService.userVerifiedUsingOtp(userId, dto.otp)
  }

  @Post('login')
  async login(@Body() logindto:LoginDto){
    return this.userService.login(logindto)
  }

}
