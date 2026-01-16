import { PrismaClient } from "@prisma/client";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log: ["warn", "error"],
  });
}

function ensureDelegate(client: PrismaClient) {
  const hasDelegate = typeof (client as PrismaClient & { dailyNote?: { findUnique?: unknown } }).dailyNote?.findUnique === "function";
  if (hasDelegate) {
    return client;
  }

  const moduleId = require.resolve("@prisma/client");
  delete require.cache[moduleId];
  const freshModule = require("@prisma/client") as { PrismaClient: typeof PrismaClient };
  return new freshModule.PrismaClient({
    log: ["warn", "error"],
  });
}

// Clear Prisma client from cache if it exists to ensure fresh client
if (globalForPrisma.prisma) {
  const moduleId = require.resolve("@prisma/client");
  delete require.cache[moduleId];
}

const existingClient = globalForPrisma.prisma;
const clientWithDelegate = existingClient ? ensureDelegate(existingClient) : ensureDelegate(createPrismaClient());

export const prisma = clientWithDelegate;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

