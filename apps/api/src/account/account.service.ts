import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MAX_ADDRESSES,
  type AddressData,
  type AddressDto,
  type AuthUserDto,
  type ProfileUpdateData,
} from '@simple-concepts/shared';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const UNIQUE_VIOLATION = 'P2002';

const ADDRESS_SELECT = {
  id: true,
  name: true,
  phone: true,
  street: true,
  area: true,
  city: true,
  state: true,
  pinCode: true,
  isDefault: true,
} satisfies Prisma.AddressSelect;

/** Orders that are still with the shop or on the road. */
const OPEN_ORDER_STATUSES = [
  'PLACED',
  'CONFIRMED',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
] as const;

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(
    userId: string,
    input: ProfileUpdateData,
  ): Promise<AuthUserDto> {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { name: input.name, email: input.email },
        select: { id: true, name: true, phone: true, email: true, role: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_VIOLATION
      ) {
        throw new ConflictException(
          'This email is already used by another account',
        );
      }
      throw error;
    }
  }

  listAddresses(userId: string): Promise<AddressDto[]> {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      select: ADDRESS_SELECT,
    });
  }

  async addAddress(userId: string, input: AddressData): Promise<AddressDto> {
    return this.prisma.$transaction(async (tx) => {
      const count = await tx.address.count({ where: { userId } });
      if (count >= MAX_ADDRESSES) {
        throw new BadRequestException(
          `You can save up to ${MAX_ADDRESSES} addresses`,
        );
      }
      // The first address is always the default.
      const isDefault = input.isDefault || count === 0;
      if (isDefault)
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      return tx.address.create({
        data: { ...input, isDefault, userId },
        select: ADDRESS_SELECT,
      });
    });
  }

  async updateAddress(
    userId: string,
    id: string,
    input: AddressData,
  ): Promise<AddressDto> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.address.findFirst({
        where: { id, userId },
        select: { isDefault: true },
      });
      if (!existing) throw new NotFoundException('Address not found');
      // Keep a default: the current default stays default unless another is chosen.
      const isDefault = input.isDefault || existing.isDefault;
      if (input.isDefault) {
        await tx.address.updateMany({
          where: { userId, NOT: { id } },
          data: { isDefault: false },
        });
      }
      return tx.address.update({
        where: { id },
        data: { ...input, isDefault },
        select: ADDRESS_SELECT,
      });
    });
  }

  async deleteAddress(userId: string, id: string): Promise<{ ok: true }> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.address.findFirst({
        where: { id, userId },
        select: { isDefault: true },
      });
      if (!existing) throw new NotFoundException('Address not found');
      await tx.address.delete({ where: { id } });
      if (existing.isDefault) {
        const next = await tx.address.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          select: { id: true },
        });
        if (next)
          await tx.address.update({
            where: { id: next.id },
            data: { isDefault: true },
          });
      }
    });
    return { ok: true };
  }

  /**
   * Closes the account (DPDP Act). Personal details are removed; past orders stay for the shop's
   * accounts, linked to an anonymous closed account. Refused while an order is still open.
   */
  async deleteAccount(userId: string): Promise<{ ok: true }> {
    const open = await this.prisma.order.count({
      where: { userId, status: { in: [...OPEN_ORDER_STATUSES] } },
    });
    if (open > 0) {
      throw new ConflictException(
        'You have orders that are not delivered yet. Cancel them or wait for delivery, then try again.',
      );
    }
    await this.prisma.$transaction([
      this.prisma.address.deleteMany({ where: { userId } }),
      this.prisma.cartItem.deleteMany({ where: { userId } }),
      this.prisma.notification.deleteMany({ where: { userId } }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          name: null,
          email: null,
          phone: `deleted-${userId}`,
          passwordHash: null,
          isActive: false,
        },
      }),
    ]);
    return { ok: true };
  }
}
