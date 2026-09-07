import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  maxRetries = 10;
  baseDelayMs = 1000;

  async onModuleInit() {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.$connect();
        return;
      } catch (err) {
        if (attempt === this.maxRetries) {
          throw err;
        }
        const delay = this.baseDelayMs * 2 ** (attempt - 1);
        const detail =
          err instanceof Error ? err.message : String(err);
        console.warn(
          `[PrismaService] DB connect attempt ${attempt}/${this.maxRetries} failed, retrying in ${delay}ms`,
          detail,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
