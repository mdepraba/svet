import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  /**
   * Body for the `GET /v1` liveness probe.
   *
   * @returns A static message. Says nothing about the database.
   */
  getData(): { message: string } {
    return { message: 'Hello API' };
  }
}
