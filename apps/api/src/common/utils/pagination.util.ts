import { PaginationDto } from '../dto/pagination.dto';
import { PaginatedResult } from '../interfaces/pagination.interface';

/**
 * The subset of a Prisma model delegate that {@link paginate} needs. Structural
 * so any generated delegate satisfies it without being named here.
 */
export interface PrismaDelegate<Entity> {
  findMany(args: any): Promise<Entity[]>;
  count(args: any): Promise<number>;
}

/**
 * Fetches one page of rows and the total count in parallel.
 *
 * @param model Prisma delegate to query.
 * @param args Model-specific args (`where`, `include`, `select`). Paging adds
 *   `skip`, `take`, and `orderBy` on top.
 * @param paginationDto Page, limit, and sort, normally from the query string.
 * @returns The rows and their `meta`. Note `limit` is reported back as
 *   `perPage`, and an unknown `sortBy` makes Prisma throw rather than 400.
 */
export async function paginate<Entity, Args extends { where?: unknown }>(
  model: PrismaDelegate<Entity>,
  args: Args,
  paginationDto: PaginationDto,
): Promise<PaginatedResult<Entity>> {
  const page = Number(paginationDto?.page) || 1;
  const limit = Number(paginationDto?.limit) || 10;

  const sortBy = paginationDto?.sortBy || 'createdAt';
  const sortOrder = paginationDto?.sortOrder || 'desc';

  const skip = Math.max(0, (page - 1) * limit);

  const queryArgs = {
    ...args,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  };

  const [data, total] = await Promise.all([
    model.findMany(queryArgs),
    model.count({ where: args.where }),
  ]);

  const lastPage = Math.ceil(total / limit);

  return {
    data,
    meta: {
      total,
      lastPage,
      currentPage: page,
      perPage: limit,
      prev: page > 1 ? page - 1 : null,
      next: page < lastPage ? page + 1 : null,
    },
  };
}
