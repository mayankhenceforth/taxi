// src/modules/company/company.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { CompanyDetails, CompanyDetailsSchema } from 'src/comman/schema/company.detail.schema';
import { AuthGuards } from 'src/comman/guards/auth.guards';
import { RoleGuards } from 'src/comman/guards/role.guards';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from 'src/comman/db/db.module';


@Module({
  imports: [
    // MongooseModule.forFeature([
    //   { name: CompanyDetails.name, schema: CompanyDetailsSchema }
    // ]),
    JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            secret: config.get<string>('ACCESS_TOKEN_SECRET'),
            signOptions: { expiresIn: '1d' },
          }),
        }),
        DatabaseModule
  ],
  controllers: [CompanyController],
  providers: [CompanyService,AuthGuards ,RoleGuards ],
  exports: [CompanyService],
})
export class CompanyModule {}