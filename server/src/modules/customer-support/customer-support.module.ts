import { Module } from '@nestjs/common';
import { CustomerSupportService } from './customer-support.service';
import { CustomerSupportController } from './customer-support.controller';
import { MailModule } from 'src/comman/mail/mail.module';
import { MailService } from 'src/comman/mail/mail.service';


@Module({
  imports:[MailModule],
  providers: [CustomerSupportService,MailService],
  controllers: [CustomerSupportController],
   exports: [CustomerSupportService],
})
export class CustomerSupportModule {}
