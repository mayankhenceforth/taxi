import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserService } from './user.service';
import { SignUpDto } from './dto/sign_up.user.dto';


@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post("sign-up")
  signUpUser(@Body() signUpDto: SignUpDto) {
    return this.userService.signUp(signUpDto);
  }
}
