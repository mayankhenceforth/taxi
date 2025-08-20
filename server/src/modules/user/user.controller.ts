import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { SignUpDto } from './dto/sign_up.user.dto';
import mongoose from 'mongoose';
import { VerifyOtpDto } from './dto/otp.verification';
import { LoginDto } from './dto/login.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadInterceptor } from 'src/comman/inerceptors/file-upload.interceptor';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';


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
  async login(@Body() logindto: LoginDto) {
    return this.userService.login(logindto)
  }


  @Post("upload-profile")
  @UseInterceptors(UploadInterceptor())
  @ApiConsumes('multipart/form-data')

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


}
