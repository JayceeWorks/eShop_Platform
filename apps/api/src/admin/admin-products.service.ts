import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  slugifyProduct,
  type AdminProductDto,
  type AdminProductInput,
  type AdminProductListQuery,
  type PageMeta,
} from '@simple-concepts/shared';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PRODUCT_SUMMARY_SELECT, searchWhere } from '../products/product-query';
import { toSummary } from '../products/products.service';

const UNIQUE_VIOLATION = 'P2002';

const ADMIN_PRODUCT_SELECT = {
  ...PRODUCT_SUMMARY_SELECT,
  sku: true,
  description: true,
  categoryId: true,
  costPriceInPaise: true,
  isActive: true,
  isFeatured: true,
  updatedAt: true,
  images: { orderBy: { sortOrder: 'asc' }, select: { url: true } },
  specs: { orderBy: { sortOrder: 'asc' }, select: { key: true, value: true } },
} satisfies Prisma.ProductSelect;

type AdminProductRow = Prisma.ProductGetPayload<{
  select: typeof ADMIN_PRODUCT_SELECT;
}>;

function toAdminProduct(row: AdminProductRow): AdminProductDto {
  return {
    ...toSummary(row),
    sku: row.sku,
    description: row.description,
    images: row.images.map(({ url }) => url),
    specs: row.specs,
    categoryId: row.categoryId,
    costPriceInPaise: row.costPriceInPaise,
    isActive: row.isActive,
    isFeatured: row.isFeatured,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toWriteData(input: AdminProductInput) {
  const { specs, images, ...fields } = input;
  return {
    data: { ...fields, slug: slugifyProduct(fields.name, fields.sku) },
    specs: specs.map((spec, sortOrder) => ({ ...spec, sortOrder })),
    images: images.map((url, sortOrder) => ({ url, sortOrder })),
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === UNIQUE_VIOLATION
  );
}

@Injectable()
export class AdminProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    query: AdminProductListQuery,
  ): Promise<{ data: AdminProductDto[]; meta: PageMeta }> {
    const where: Prisma.ProductWhereInput = {
      ...(query.status === 'all'
        ? {}
        : { isActive: query.status === 'active' }),
      ...(query.q ? { AND: searchWhere(query.q) } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: ADMIN_PRODUCT_SELECT,
      }),
      this.prisma.product.count({ where }),
    ]);
    return {
      data: rows.map(toAdminProduct),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async get(id: string): Promise<AdminProductDto> {
    const row = await this.prisma.product.findUnique({
      where: { id },
      select: ADMIN_PRODUCT_SELECT,
    });
    if (!row) throw new NotFoundException('Product not found');
    return toAdminProduct(row);
  }

  async create(input: AdminProductInput): Promise<AdminProductDto> {
    await this.assertCategory(input.categoryId);
    const { data, specs, images } = toWriteData(input);
    try {
      const row = await this.prisma.product.create({
        data: { ...data, specs: { create: specs }, images: { create: images } },
        select: ADMIN_PRODUCT_SELECT,
      });
      return toAdminProduct(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('A product with this SKU already exists');
      }
      throw error;
    }
  }

  async update(id: string, input: AdminProductInput): Promise<AdminProductDto> {
    await this.assertCategory(input.categoryId);
    const { data, specs, images } = toWriteData(input);
    try {
      const row = await this.prisma.$transaction(async (tx) => {
        const exists = await tx.product.findUnique({
          where: { id },
          select: { id: true },
        });
        if (!exists) throw new NotFoundException('Product not found');
        await tx.productSpec.deleteMany({ where: { productId: id } });
        await tx.productImage.deleteMany({ where: { productId: id } });
        return tx.product.update({
          where: { id },
          data: {
            ...data,
            specs: { create: specs },
            images: { create: images },
          },
          select: ADMIN_PRODUCT_SELECT,
        });
      });
      return toAdminProduct(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('A product with this SKU already exists');
      }
      throw error;
    }
  }

  /** Soft delete: hides the product from customers but keeps it for past orders. */
  setActive(id: string, isActive: boolean): Promise<AdminProductDto> {
    return this.prisma.product
      .update({
        where: { id },
        data: { isActive },
        select: ADMIN_PRODUCT_SELECT,
      })
      .then(toAdminProduct)
      .catch((error: unknown) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          throw new NotFoundException('Product not found');
        }
        throw error;
      });
  }

  private async assertCategory(categoryId: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) throw new BadRequestException('Choose a valid category');
  }
}
