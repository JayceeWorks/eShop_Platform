import { Controller, Get } from '@nestjs/common';
import type { CategoryDto } from '@simple-concepts/shared';
import { PrismaService } from '../prisma/prisma.service';

const CATEGORY_FIELDS = {
  id: true,
  name: true,
  slug: true,
  imageUrl: true,
} as const;

@Controller('categories')
export class CategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(): Promise<CategoryDto[]> {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: 'asc' },
      select: {
        ...CATEGORY_FIELDS,
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: CATEGORY_FIELDS,
        },
      },
    });
    return categories.map((category) => ({
      ...category,
      children: category.children.map((child) => ({ ...child, children: [] })),
    }));
  }
}
