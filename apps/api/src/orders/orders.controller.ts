import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AdminOrderStatusSchema,
  CancelOrderSchema,
  OrderListQuerySchema,
  PlaceOrderSchema,
  type AdminOrderStatusData,
  type CancelOrderData,
  type OrderListQuery,
  type PlaceOrderData,
} from '@simple-concepts/shared';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { SchemaPipe } from '../common/schema.pipe';
import { OrdersService } from './orders.service';

const listQuery = new SchemaPipe<OrderListQuery>(OrderListQuerySchema);

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly orders: OrdersService) {}

  @Get('config')
  config() {
    return this.orders.checkoutConfig();
  }
}

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  place(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new SchemaPipe<PlaceOrderData>(PlaceOrderSchema))
    body: PlaceOrderData,
  ) {
    return this.orders.place(user.id, body);
  }

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(listQuery) query: OrderListQuery,
  ) {
    return this.orders.listForCustomer(user.id, query);
  }

  @Get(':id')
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.orders.getForCustomer(user.id, id);
  }

  @Post(':id/cancel')
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new SchemaPipe<CancelOrderData>(CancelOrderSchema))
    body: CancelOrderData,
  ) {
    return this.orders.cancelForCustomer(user.id, id, body.reason);
  }
}

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(@Query(listQuery) query: OrderListQuery) {
    return this.orders.listForAdmin(query);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.orders.getForAdmin(id);
  }

  @Post(':id/status')
  setStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new SchemaPipe<AdminOrderStatusData>(AdminOrderStatusSchema))
    body: AdminOrderStatusData,
  ) {
    return this.orders.changeStatusAsAdmin(user.id, id, body.status, body.note);
  }
}
