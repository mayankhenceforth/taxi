
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateCustomerSupportDto } from './dto/create-customer-support.dto';
import { CustomerSupport } from 'src/comman/schema/customerSupport.schema';
import { MailService } from 'src/comman/mail/mail.service';
import { User, UserDocument } from 'src/comman/schema/user.schema';


@Injectable()
export class CustomerSupportService {
  constructor(
    @InjectModel(CustomerSupport.name)
    private supportModel: Model<CustomerSupport>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private mailerService: MailService,
  ) { }

  async createSupportTicket(dto: CreateCustomerSupportDto): Promise<CustomerSupport> {
    const ticket = await this.supportModel.create({
      rideId: new Types.ObjectId(dto.rideId),
      userId: new Types.ObjectId(dto.userId),
      role: dto.role,
      subject: dto.subject,
      message: dto.message,
    });

    await ticket.save();
    const userInfo = await this.userModel.findById(dto.userId)
    if (!userInfo) {
      throw new BadRequestException("user not found")
    }

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color:#0a58ca;">New Support Ticket Created</h2>
      <p>A new support ticket has been submitted by <strong>${dto.role}</strong>.</p>
      <h3>Ticket Details:</h3>
      <ul>
        <li><strong>Ride ID:</strong> ${dto.rideId}</li>
        <li><strong>User ID:</strong> ${dto.userId}</li>
        <li><strong>User Name:</strong> ${userInfo.name}</li>
        <li><strong>Contact Number:</strong> ${userInfo.contactNumber}</li>
        <li><strong>Subject:</strong> ${dto.subject}</li>
        <li><strong>Message:</strong> ${dto.message}</li>
      </ul>
      <p>Please review the ticket and respond promptly.</p>
    </div>
  `;

    // Send email notification to support team
    await this.mailerService.sendMail({
      to: 'mayank8355@gmail.com',
      subject: `New Support Ticket: ${dto.subject}`,
      html: htmlContent,
    });

    return ticket;
  }

  async getTicketById(id: string): Promise<CustomerSupport> {
    const ticket = await this.supportModel.findById(id).exec();
    if (!ticket) throw new NotFoundException('Support ticket not found');
    return ticket;
  }

  async updateTicketStatus(id: string, status: string) {
    const ticket = await this.supportModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );
    if (!ticket) throw new NotFoundException('Support ticket not found');
    return ticket;
  }

  async listTickets() {
    return this.supportModel.find().sort({ createdAt: -1 }).exec();
  }
}
