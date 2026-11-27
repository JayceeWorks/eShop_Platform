import { Module } from '@nestjs/common';
import { AccountController } from './account/account.controller';
import { AccountService } from './account/account.service';
import { AdminProductsController } from './admin/admin-products.controller';
import { AdminProductsService } from './admin/admin-products.service';
import { AuthModule } from './auth/auth.module';
import { CategoriesController } from './categories/categories.controller';
import {
  AdminFeedbackController,
  FeedbackController,
  ProductReviewsController,
} from './feedback/feedback.controller';
import { FeedbackService } from './feedback/feedback.service';
import { HealthController } from './health/health.controller';
import { NotificationsService } from './notifications/notifications.service';
import {
  AdminOrdersController,
  CheckoutController,
  OrdersController,
} from './orders/orders.controller';
import { OrdersService } from './orders/orders.service';
import { CodProvider } from './payments/cod.provider';
import { PaymentsService } from './payments/payments.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';
import { AdminUploadsController } from './uploads/admin-uploads.controller';
import { LocalImageStorage } from './uploads/local-image-storage';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    HealthController,
    CategoriesController,
    ProductReviewsController,
    ProductsController,
    CheckoutController,
    OrdersController,
    AccountController,
    FeedbackController,
    AdminProductsController,
    AdminOrdersController,
    AdminFeedbackController,
    AdminUploadsController,
  ],
  providers: [
    ProductsService,
    AdminProductsService,
    LocalImageStorage,
    AccountService,
    NotificationsService,
    CodProvider,
    PaymentsService,
    OrdersService,
    FeedbackService,
  ],
})
export class AppModule {}
