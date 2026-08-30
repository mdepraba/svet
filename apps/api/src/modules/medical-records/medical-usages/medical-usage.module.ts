import { Module } from '@nestjs/common';
import { MedicalUsageController } from './medical-usage.controller';
import { MedicalUsageService } from './medical-usage.service';

@Module({
  controllers: [MedicalUsageController],
  providers: [MedicalUsageService],
  exports: [MedicalUsageService],
})
export class MedicalUsageModule {}
