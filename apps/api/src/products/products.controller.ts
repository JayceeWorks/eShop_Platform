import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ProductFilterOptionsQuerySchema,
  ProductListQuerySchema,
  type ProductFilterOptionsQuery,
  type ProductListQuery,
} from '@simple-concepts/shared';
import { SchemaPipe } from '../common/schema.pipe';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(
    @Query(new SchemaPipe<ProductListQuery>(ProductListQuerySchema))
    query: ProductListQuery,
  ) {
    return this.products.list(query);
  }

  // Declared before :slug so "filters" is not treated as a product slug.
  @Get('filters')
  filters(
    @Query(
      new SchemaPipe<ProductFilterOptionsQuery>(
        ProductFilterOptionsQuerySchema,
      ),
    )
    query: ProductFilterOptionsQuery,
  ) {
    return this.products.filterOptions(query);
  }

  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.products.findBySlug(slug);
  }
}
