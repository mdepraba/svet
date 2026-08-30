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
import { VisitProductAssocService } from './visit-product-assoc.service';
import {
  CreateVisitProductAssocDto,
  UpdateVisitProductAssocDto,
} from './dto/visit-product-assoc.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';

@Controller('visit/detail/product')
export class VisitProductAssocController {
  constructor(private readonly service: VisitProductAssocService) {}

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
  create(@Body() input: CreateVisitProductAssocDto) {
    return this.service.create(input);
  }

  @Patch('bulk')
  createMany(@Body() inputs: CreateVisitProductAssocDto[]) {
    return this.service.createMany(inputs);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() input: UpdateVisitProductAssocDto) {
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
