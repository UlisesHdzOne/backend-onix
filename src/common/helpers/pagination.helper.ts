import { BadRequestException } from '@nestjs/common';

export class PaginationHelper {
  static DEFAULT_PAGE = 1;
  static DEFAULT_LIMIT = 10;
  static MIN_PAGE = 1;
  static MIN_LIMIT = 1;
  static MAX_LIMIT = 100;

  static validate(page: number, limit: number) {
    if (page < this.MIN_PAGE) {
      throw new BadRequestException('Page must be greater than 0');
    }

    if (limit < this.MIN_LIMIT || limit > this.MAX_LIMIT) {
      throw new BadRequestException(
        `Limit must be between ${this.MIN_LIMIT} and ${this.MAX_LIMIT}`,
      );
    }

    return { skip: (page - 1) * limit, take: limit };
  }

  static buildMeta(page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > this.MIN_PAGE,
    };
  }
}
