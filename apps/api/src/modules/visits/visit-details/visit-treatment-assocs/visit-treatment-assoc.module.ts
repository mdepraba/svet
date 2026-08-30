import { Module } from '@nestjs/common';
import { VisitTreatmentAssocController } from './visit-treatment-assoc.controller';
import { VisitTreatmentAssocService } from './visit-treatment-assoc.service';

@Module({
  controllers: [VisitTreatmentAssocController],
  providers: [VisitTreatmentAssocService],
})
export class VisitTreatmentAssocModule {}
