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
import { TreatmentService } from './treatment.service';
import {
  CreateTreatmentDto,
  SaveTreatmentRecipeDto,
  UpdateTreatmentDto,
} from './dto/treatment.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';

@Controller('treatment')
export class TreatmentController {
  constructor(private readonly service: TreatmentService) {}

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
  create(@Body() input: CreateTreatmentDto) {
    return this.service.create(input);
  }

  @Patch('bulk')
  createMany(@Body() inputs: CreateTreatmentDto[]) {
    return this.service.createMany(inputs);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() input: UpdateTreatmentDto) {
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

  /** Replaces the treatment's default product recipe. */
  @Patch(':id/recipe')
  saveRecipe(@Param('id') id: string, @Body() input: SaveTreatmentRecipeDto) {
    return this.service.saveRecipe(id, input.lines);
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
