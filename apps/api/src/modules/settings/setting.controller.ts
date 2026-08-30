import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UpdateClinicSettingsDto } from './dto/setting.dto';
import { SettingService } from './setting.service';

@Controller('setting')
export class SettingController {
  constructor(private readonly service: SettingService) {}

  @Get()
  read() {
    return this.service.read();
  }

  @Patch()
  update(@Body() input: UpdateClinicSettingsDto) {
    return this.service.update(input);
  }
}
