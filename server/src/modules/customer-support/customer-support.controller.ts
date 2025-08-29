// src/modules/customer-support/customer-support.controller.ts
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CustomerSupportService } from './customer-support.service';
import { CreateCustomerSupportDto } from './dto/create-customer-support.dto';

@Controller('support')
export class CustomerSupportController {
  constructor(private readonly supportService: CustomerSupportService) {}

  @Post()
  async createTicket(@Body() dto: CreateCustomerSupportDto) {
    return this.supportService.createSupportTicket(dto);
  }

  @Get()
  async listTickets() {
    return this.supportService.listTickets();
  }

  @Get(':id')
  async getTicket(@Param('id') id: string) {
    return this.supportService.getTicketById(id);
  }

  @Patch(':id/status/:status')
  async updateStatus(
    @Param('id') id: string,
    @Param('status') status: string,
  ) {
    return this.supportService.updateTicketStatus(id, status);
  }
}
