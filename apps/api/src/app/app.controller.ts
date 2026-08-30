import { Controller, Get } from '@nestjs/common';
import { Public } from '@/guard/public.decorator';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // The liveness check has to answer before anyone has signed in.
  @Public()
  @Get()
  getData() {
    return this.appService.getData();
  }
}
