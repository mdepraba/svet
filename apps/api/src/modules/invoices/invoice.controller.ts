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
import { PaginationDto } from '@/common/dto/pagination.dto';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';
import { InvoiceService } from './invoice.service';

@Controller('invoice')
export class InvoiceController {
  constructor(private readonly service: InvoiceService) {}

  // Declared before `:id` so the literal segment is not swallowed by the param.
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
  create(@Body() input: CreateInvoiceDto) {
    return this.service.create(input);
  }

  @Patch('restore/:id')
  restore(@Param('id') id: string) {
    return this.service.restore(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() input: UpdateInvoiceDto) {
    return this.service.update(id, input);
  }

  @Delete('bulk')
  removeMany(@Body() ids: string[]) {
    return this.service.removeMany(ids);
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
