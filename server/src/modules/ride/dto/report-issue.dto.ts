import { IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class ReportIssueDto {
  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsNotEmpty()
  @IsString()
  message: string;
}
