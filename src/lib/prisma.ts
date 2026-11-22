import { PrismaClient } from "@prisma/client";

/**
 * PrismaClient singleton.
 *
 * In development, Next.js hot-reloads modules (HMR) and each reload would
 * create a new PrismaClient instance, exhausting the connection pool.
 * To avoid that we cache the instance on globalThis. In production a single
 * instance per process is always created.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
