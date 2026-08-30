import { createZodDto } from 'nestjs-zod';
import { PaginationSchema } from '@svet-monorepo/schemas';

/**
 * Query parameters accepted by every list endpoint: `page`, `limit`, `search`,
 * `sortBy`, `sortOrder`. Rules and defaults live in `PaginationSchema`.
 */
export class PaginationDto extends createZodDto(PaginationSchema) {}
