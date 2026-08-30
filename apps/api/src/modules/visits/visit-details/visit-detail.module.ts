import { Module } from '@nestjs/common';
import { VisitDetailController } from './visit-detail.controller';
import { VisitDetailService } from './visit-detail.service';
import { VisitProductAssocModule } from './visit-product-assocs/visit-product-assoc.module';
import { VisitTreatmentAssocModule } from './visit-treatment-assocs/visit-treatment-assoc.module';

@Module({
  imports: [VisitProductAssocModule, VisitTreatmentAssocModule],
  controllers: [VisitDetailController],
  providers: [VisitDetailService],
  exports: [VisitDetailService],
})
export class VisitDetailModule {}
