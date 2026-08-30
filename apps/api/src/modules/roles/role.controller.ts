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
import { RoleService } from './role.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';

@Controller('role')
export class RoleController {
  constructor(private readonly service: RoleService) {}

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
  create(@Body() input: CreateRoleDto) {
    return this.service.create(input);
  }

  @Patch('bulk')
  createMany(@Body() inputs: CreateRoleDto[]) {
    return this.service.createMany(inputs);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() input: UpdateRoleDto) {
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
