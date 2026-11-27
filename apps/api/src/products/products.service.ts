import { Injectable, NotFoundException } from '@nestjs/common';
import {
  FILTERABLE_SPEC_KEYS,
  type PageMeta,
  type ProductDetailDto,
  type ProductFilterOptionsDto,
  type ProductFilterOptionsQuery,
  type ProductListQuery,
  type ProductSummaryDto,
} from '@simple-concepts/shared';
import { PrismaService } from '../prisma/prisma.service';
import {
  PRODUCT_SUMMARY_SELECT,
  type ProductSummaryRow,
  buildProductOrderBy,
  buildProductWhere,
  categoryWhere,
} from './product-query';

export function toSummary(row: ProductSummaryRow): ProductSummaryDto {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    brand: row.brand,
    model: row.model,
    priceInPaise: row.priceInPaise,
    mrpInPaise: row.mrpInPaise,
    stockQty: row.stockQty,
    imageUrl: row.images[0]?.url ?? null,
    category: {
      name: row.category.name,
      slug: row.category.slug,
      parentSlug: row.category.parent?.slug ?? null,
    },
  };
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    query: ProductListQuery,
  ): Promise<{ data: ProductSummaryDto[]; meta: PageMeta }> {
    const where = buildProductWhere(query);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: buildProductOrderBy(query.sort),
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: PRODUCT_SUMMARY_SELECT,
      }),
      this.prisma.product.count({ where }),
    ]);
    return {
      data: rows.map(toSummary),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async filterOptions({
    category,
  }: ProductFilterOptionsQuery): Promise<ProductFilterOptionsDto> {
    const productWhere = {
      isActive: true,
      ...(category ? categoryWhere(category) : {}),
    };
    const [brands, specs] = await Promise.all([
      this.prisma.product.findMany({
        where: productWhere,
        distinct: ['brand'],
        orderBy: { brand: 'asc' },
        select: { brand: true },
      }),
      this.prisma.productSpec.findMany({
        where: {
          key: { in: Object.values(FILTERABLE_SPEC_KEYS) },
          product: productWhere,
        },
        distinct: ['key', 'value'],
        orderBy: { value: 'asc' },
        select: { key: true, value: true },
      }),
    ]);
    const valuesFor = (key: string) =>
      specs.filter((spec) => spec.key === key).map((spec) => spec.value);

    return {
      brands: brands.map(({ brand }) => brand),
      resolutions: valuesFor(FILTERABLE_SPEC_KEYS.resolution),
      placements: valuesFor(FILTERABLE_SPEC_KEYS.placement),
      connections: valuesFor(FILTERABLE_SPEC_KEYS.connection),
    };
  }

  async findBySlug(slug: string): Promise<ProductDetailDto> {
    const row = await this.prisma.product.findFirst({
      where: { slug, isActive: true },
      select: {
        ...PRODUCT_SUMMARY_SELECT,
        sku: true,
        description: true,
        images: { orderBy: { sortOrder: 'asc' }, select: { url: true } },
        specs: {
          orderBy: { sortOrder: 'asc' },
          select: { key: true, value: true },
        },
      },
    });
    if (!row) throw new NotFoundException('Product not found');

    return {
      ...toSummary(row),
      sku: row.sku,
      description: row.description,
      images: row.images.map(({ url }) => url),
      specs: row.specs,
    };
  }
}
