import { Module } from '@nestjs/common';
import { TreatmentController } from './treatment.controller';
import { TreatmentService } from './treatment.service';
import { TreatmentCategoryModule } from './treatment-category/treatment-category.module';

@Module({
  imports: [TreatmentCategoryModule],
  controllers: [TreatmentController],
  providers: [TreatmentService],
})
export class TreatmentModule {}
