import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateStockMovementDto, LedgerQueryDto } from './dto/inventory.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  /** The append-only ledger, newest movement first. */
  @Get('ledger')
  findLedger(@Query() query: LedgerQueryDto) {
    return this.service.findLedger(query);
  }

  /** On-hand quantity per product. */
  @Get('stock')
  findStock() {
    return this.service.findStock();
  }

  /** Products at or below the clinic's reorder point. */
  @Get('low-stock')
  findLowStock(@Query('threshold') threshold?: string) {
    return this.service.findLowStock(threshold ? Number(threshold) : undefined);
  }

  @Post('movement')
  record(@Body() input: CreateStockMovementDto) {
    return this.service.record(input);
  }
}
