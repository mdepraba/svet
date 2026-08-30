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
import { MedicalRecordService } from './medical-record.service';
import {
  CreateMedicalRecordDto,
  UpdateMedicalRecordDto,
} from './dto/medical-record.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';

@Controller('medical-record')
export class MedicalRecordController {
  constructor(private readonly service: MedicalRecordService) {}

  @Get('all')
  findForBackup() {
    return this.service.findForBackup();
  }

  /** One patient's chart, newest first. */
  @Get('patient/:patientId')
  findForPatient(@Param('patientId') patientId: string) {
    return this.service.findForPatient(patientId);
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
  create(@Body() input: CreateMedicalRecordDto) {
    return this.service.create(input);
  }

  @Patch('bulk')
  createMany(@Body() inputs: CreateMedicalRecordDto[]) {
    return this.service.createMany(inputs);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() input: UpdateMedicalRecordDto) {
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
