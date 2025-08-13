import { BadRequestException, Injectable } from '@nestjs/common';
import { SignUpDto } from './dto/sign_up.user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/comman/schema/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt'


@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>,) { }
  async signUp(signUp: SignUpDto) {


    const existingUser = await this.userModel.findOne({
      contactNumber: signUp.contactNumber,
    });

    if(existingUser){
      throw new BadRequestException("User already exist")
    }

    // Hash password
    const hashedPassword = await bcrypt.hashSync(signUp.password, 10);

    const new_user = await this.userModel.create({
      ...signUp,
      password: hashedPassword,
    });


    return {
      message:"user created successfully",
      data:new_user
    }
    
  }
}
