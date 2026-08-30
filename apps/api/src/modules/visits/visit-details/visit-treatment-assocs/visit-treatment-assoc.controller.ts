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
import { VisitTreatmentAssocService } from './visit-treatment-assoc.service';
import {
  CreateVisitTreatmentAssocDto,
  UpdateVisitTreatmentAssocDto,
} from './dto/visit-treatment-assoc.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';

@Controller('visit/detail/treatment')
export class VisitTreatmentAssocController {
  constructor(private readonly service: VisitTreatmentAssocService) {}

  @Get('all')
  findForBackup() {
    return this.service.findForBackup();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.service.findAll(query);
  }

  @Post()
  create(@Body() input: CreateVisitTreatmentAssocDto) {
    return this.service.create(input);
  }

  @Patch('bulk')
  createMany(@Body() inputs: CreateVisitTreatmentAssocDto[]) {
    return this.service.createMany(inputs);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() input: UpdateVisitTreatmentAssocDto) {
    return this.service.update(id, input);
  }

  @Delete('bulk')
  removeMany(@Body() ids: string[]) {
    return this.service.removeMany(ids);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Delete('force/bulk')
  forceRemoveMany(@Body() ids: string[]) {
    return this.service.forceRemoveMany(ids);
  }

  @Delete('force/:id')
  forceRemove(@Param('id') id: string) {
    return this.service.forceRemove(id);
  }

  @Patch('restore/bulk')
  restoreMany(@Body() ids: string[]) {
    return this.service.restoreMany(ids);
  }

  @Patch('restore/:id')
  restore(@Param('id') id: string) {
    return this.service.restore(id);
  }
}
