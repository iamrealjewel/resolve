import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const url = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: parseInt(url.port || "3306"),
  user: url.username,
  password: decodeURIComponent(url.password),
  database: url.pathname.substring(1),
});

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") {
  const g = global as any;
  if (g.prisma && !g.prisma.dataTemplate) {
    console.log("♻️ Stale Prisma instance detected. Force-refreshing client...");
    delete g.prisma;
  }
  globalForPrisma.prisma = prisma;
}
// Last regenerated: 2026-05-12T18:40:00

