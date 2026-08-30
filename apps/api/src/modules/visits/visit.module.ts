import { Module } from '@nestjs/common';
import { InventoryModule } from '@/modules/inventory/inventory.module';
import { InvoiceModule } from '@/modules/invoices/invoice.module';
import { SettingModule } from '@/modules/settings/setting.module';
import { VisitController } from './visit.controller';
import { VisitService } from './visit.service';

@Module({
  imports: [InvoiceModule, InventoryModule, SettingModule],
  controllers: [VisitController],
  providers: [VisitService],
  exports: [VisitService],
})
export class VisitModule {}
