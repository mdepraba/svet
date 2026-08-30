import { Module } from '@nestjs/common';
import { SettingModule } from '@/modules/settings/setting.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [SettingModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
