import { existsSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { hashPassword } from '../src/auth/password';
import { SAMPLE_PICTURES, SEED_CATEGORIES, SEED_PRODUCTS } from './seed-data';

const PAISE_PER_RUPEE = 100;
const MIN_ADMIN_PASSWORD_LENGTH = 8;
// Served by the API from apps/api/public/products.
const SAMPLE_PICTURE_PATH = '/static/products/';
// Sample cost price, as a percentage of the selling price.
const SAMPLE_COST_PERCENT = 70;
const PERCENT = 100;

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function seedCategories(): Promise<Map<string, string>> {
  const idsBySlug = new Map<string, string>();

  for (const [index, category] of SEED_CATEGORIES.entries()) {
    const parent = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: { name: category.name, slug: category.slug, sortOrder: index },
    });
    idsBySlug.set(parent.slug, parent.id);

    for (const [childIndex, child] of (category.children ?? []).entries()) {
      const saved = await prisma.category.upsert({
        where: { slug: child.slug },
        update: {},
        create: {
          name: child.name,
          slug: child.slug,
          parentId: parent.id,
          sortOrder: childIndex,
        },
      });
      idsBySlug.set(saved.slug, saved.id);
    }
  }
  return idsBySlug;
}

async function seedProducts(categoryIds: Map<string, string>): Promise<void> {
  for (const product of SEED_PRODUCTS) {
    const categoryId = categoryIds.get(product.categorySlug);
    if (!categoryId)
      throw new Error(`Unknown category: ${product.categorySlug}`);

    const priceInPaise = product.priceInRupees * PAISE_PER_RUPEE;
    // Empty update: re-seeding must never overwrite prices or stock set by the owner.
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: {
        name: product.name,
        slug: `${slugify(product.name)}-${product.sku.toLowerCase()}`,
        sku: product.sku,
        brand: product.brand,
        model: product.model,
        categoryId,
        description: product.description,
        priceInPaise,
        mrpInPaise: product.mrpInRupees * PAISE_PER_RUPEE,
        costPriceInPaise: Math.round(
          (priceInPaise * SAMPLE_COST_PERCENT) / PERCENT,
        ),
        stockQty: product.stockQty,
        isFeatured: product.isFeatured ?? false,
        specs: {
          create: Object.entries(product.specs).map(
            ([key, value], sortOrder) => ({
              key,
              value,
              sortOrder,
            }),
          ),
        },
      },
    });
  }
}

/** Adds the matching sample picture to products that have no photos yet. */
async function seedSamplePictures(): Promise<number> {
  let added = 0;
  for (const [sku, picture] of Object.entries(SAMPLE_PICTURES)) {
    const product = await prisma.product.findUnique({
      where: { sku },
      select: { id: true, _count: { select: { images: true } } },
    });
    if (!product || product._count.images > 0) continue;
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: `${SAMPLE_PICTURE_PATH}${picture}.svg`,
        sortOrder: 0,
      },
    });
    added += 1;
  }
  return added;
}

/** Creates the first admin from environment variables. Never resets an existing password. */
async function seedAdmin(): Promise<string> {
  const { ADMIN_NAME, ADMIN_PHONE, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_PHONE || !ADMIN_PASSWORD)
    return 'Skipped admin: set ADMIN_PHONE and ADMIN_PASSWORD.';
  if (ADMIN_PASSWORD.length < MIN_ADMIN_PASSWORD_LENGTH) {
    throw new Error(
      `ADMIN_PASSWORD must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters`,
    );
  }
  const existing = await prisma.user.findUnique({
    where: { phone: ADMIN_PHONE },
  });
  if (existing) return 'Admin already exists.';
  await prisma.user.create({
    data: {
      name: ADMIN_NAME || null,
      phone: ADMIN_PHONE,
      email: ADMIN_EMAIL?.toLowerCase() || null,
      role: 'ADMIN',
      passwordHash: await hashPassword(ADMIN_PASSWORD),
    },
  });
  return 'Created admin.';
}

async function main(): Promise<void> {
  const categoryIds = await seedCategories();
  await seedProducts(categoryIds);
  const pictures = await seedSamplePictures();
  const admin = await seedAdmin();
  console.log(
    `Seeded ${categoryIds.size} categories and ${SEED_PRODUCTS.length} products. ` +
      `Added ${pictures} sample pictures. ${admin}`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
