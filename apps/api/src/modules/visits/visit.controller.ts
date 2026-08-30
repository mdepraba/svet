import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { VisitService } from './visit.service';
import {
  CreateVisitDto,
  SaveWorksheetDto,
  UpdateVisitDto,
  VisitQueryDto,
} from './dto/visit.dto';

@Controller('visit')
export class VisitController {
  constructor(private readonly service: VisitService) {}

  // Literal segments are declared before `:id` so the param does not swallow
  // them — Fastify matches in declaration order.
  @Get('all')
  findForBackup() {
    return this.service.findForBackup();
  }

  /** The dashboard queue, e.g. `/visit/day?date=2026-08-14`. */
  @Get('day')
  findForDay(@Query('date') date?: string) {
    return this.service.findForDay(date ?? new Date().toISOString());
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get()
  findAll(@Query() query: VisitQueryDto) {
    return this.service.findAll(query);
  }

  @Post()
  create(@Body() input: CreateVisitDto) {
    return this.service.create(input);
  }

  @Patch('bulk')
  createMany(@Body() inputs: CreateVisitDto[]) {
    return this.service.createMany(inputs);
  }

  /** Save Only — keeps the visit open. */
  @Patch(':id/draft')
  saveAsDraft(@Param('id') id: string, @Body() input: SaveWorksheetDto) {
    return this.service.saveAsDraft(id, input);
  }

  /** Save and Make Invoice — closes the visit and bills it. */
  @Patch(':id/finished')
  finish(@Param('id') id: string, @Body() input: SaveWorksheetDto) {
    return this.service.finish(id, input);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }

  @Patch('restore/bulk')
  restoreMany(@Body() ids: string[]) {
    return this.service.restoreMany(ids);
  }

  @Patch('restore/:id')
  restore(@Param('id') id: string) {
    return this.service.restore(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() input: UpdateVisitDto) {
    return this.service.update(id, input);
  }

  @Delete('bulk')
  removeMany(@Body() ids: string[]) {
    return this.service.removeMany(ids);
  }

  @Delete('force/bulk')
  forceRemoveMany(@Body() ids: string[]) {
    return this.service.forceRemoveMany(ids);
  }

  @Delete('force/:id')
  forceRemove(@Param('id') id: string) {
    return this.service.forceRemove(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
