import { BadRequestException, PipeTransform } from '@nestjs/common';

type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: { issues: { message: string }[] } };

type QuerySchema<T> = { safeParse(value: unknown): ParseResult<T> };

export class SchemaPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: QuerySchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;
    throw new BadRequestException(
      result.error.issues.map((issue) => issue.message).join(', '),
    );
  }
}
