import { Module } from '@nestjs/common';
import { VisitProductAssocController } from './visit-product-assoc.controller';
import { VisitProductAssocService } from './visit-product-assoc.service';

@Module({
  controllers: [VisitProductAssocController],
  providers: [VisitProductAssocService],
})
export class VisitProductAssocModule {}
