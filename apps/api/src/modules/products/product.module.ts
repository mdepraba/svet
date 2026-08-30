import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductCategoryModule } from './product-categories/product-category.module';

@Module({
  imports: [ProductCategoryModule],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
