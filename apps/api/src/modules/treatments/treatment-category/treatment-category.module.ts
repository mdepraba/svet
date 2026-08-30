import { Module } from '@nestjs/common';
import { TreatmentCategoryController } from './treatment-category.controller';
import { TreatmentCategoryService } from './treatment-category.service';

@Module({
  controllers: [TreatmentCategoryController],
  providers: [TreatmentCategoryService],
})
export class TreatmentCategoryModule {}
