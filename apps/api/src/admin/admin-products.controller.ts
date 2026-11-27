import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AdminProductInputSchema,
  AdminProductListQuerySchema,
  type AdminProductInput,
  type AdminProductListQuery,
} from '@simple-concepts/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { SchemaPipe } from '../common/schema.pipe';
import { AdminProductsService } from './admin-products.service';

const productInput = new SchemaPipe<AdminProductInput>(AdminProductInputSchema);

@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminProductsController {
  constructor(private readonly products: AdminProductsService) {}

  @Get()
  list(
    @Query(new SchemaPipe<AdminProductListQuery>(AdminProductListQuerySchema))
    query: AdminProductListQuery,
  ) {
    return this.products.list(query);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.products.get(id);
  }

  @Post()
  create(@Body(productInput) body: AdminProductInput) {
    return this.products.create(body);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(productInput) body: AdminProductInput,
  ) {
    return this.products.update(id, body);
  }

  @Delete(':id')
  hide(@Param('id', ParseUUIDPipe) id: string) {
    return this.products.setActive(id, false);
  }

  @Post(':id/restore')
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.products.setActive(id, true);
  }
}
