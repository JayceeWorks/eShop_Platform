import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AddressInputSchema,
  ProfileUpdateSchema,
  type AddressData,
  type ProfileUpdateData,
} from '@simple-concepts/shared';
import { AuthService } from '../auth/auth.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SchemaPipe } from '../common/schema.pipe';
import { NotificationsService } from '../notifications/notifications.service';
import { AccountService } from './account.service';

const OK = 200;
const MAX_NOTIFICATIONS_PAGE = 50;
const DEFAULT_NOTIFICATIONS_PAGE = 20;

const addressInput = new SchemaPipe<AddressData>(AddressInputSchema);

function pageNumber(
  value: string | undefined,
  fallback: number,
  max: number,
): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1
    ? Math.min(parsed, max)
    : fallback;
}

@Controller('me')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(
    private readonly auth: AuthService,
    private readonly account: AccountService,
    private readonly notifications: NotificationsService,
  ) {}

  @Get()
  profile(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.findActiveUser(user.id);
  }

  @Put()
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new SchemaPipe<ProfileUpdateData>(ProfileUpdateSchema))
    body: ProfileUpdateData,
  ) {
    return this.account.updateProfile(user.id, body);
  }

  @Delete()
  deleteAccount(@CurrentUser() user: AuthenticatedUser) {
    return this.account.deleteAccount(user.id);
  }

  @Get('addresses')
  addresses(@CurrentUser() user: AuthenticatedUser) {
    return this.account.listAddresses(user.id);
  }

  @Post('addresses')
  addAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Body(addressInput) body: AddressData,
  ) {
    return this.account.addAddress(user.id, body);
  }

  @Put('addresses/:id')
  updateAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(addressInput) body: AddressData,
  ) {
    return this.account.updateAddress(user.id, id, body);
  }

  @Delete('addresses/:id')
  deleteAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.account.deleteAddress(user.id, id);
  }

  @Get('notifications')
  notificationList(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notifications.list(
      user.id,
      pageNumber(page, 1, Number.MAX_SAFE_INTEGER),
      pageNumber(limit, DEFAULT_NOTIFICATIONS_PAGE, MAX_NOTIFICATIONS_PAGE),
    );
  }

  @Get('notifications/unread-count')
  unreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.unreadCount(user.id);
  }

  @Post('notifications/read-all')
  @HttpCode(OK)
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.markAllRead(user.id);
  }

  @Post('notifications/:id/read')
  @HttpCode(OK)
  markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notifications.markRead(user.id, id);
  }
}
