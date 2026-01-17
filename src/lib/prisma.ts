import { PrismaClient } from "@prisma/client";
import { createRequire } from "module";
import { unstable_noStore as noStore } from 'next/cache';

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

// Create a fail-safe proxy for the Prisma client
// This ensures that any attempt to use Prisma during build without DATABASE_URL
// triggers a dynamic bailout instead of a build error
const prismaProxy = new Proxy(clientWithDelegate, {
  get(target: any, prop: string) {
    const value = target[prop];
    
    // Check if we're accessing a model (e.g., prisma.user)
    if (value && typeof value === 'object' && prop !== 'constructor' && !prop.startsWith('$')) {
      return new Proxy(value, {
        get(modelTarget: any, modelProp: string) {
          const method = modelTarget[modelProp];
          
          // Check if we're calling a method (e.g., findUnique)
          if (typeof method === 'function') {
            return (...args: any[]) => {
              // If we're in build mode and DATABASE_URL is missing, trigger bailout
              if (typeof window === 'undefined' && !process.env.DATABASE_URL) {
                try {
                  noStore();
                } catch (e) {
                  // If it's already a dynamic bailout error, rethrow it
                  if ((e as any)?.digest?.includes('DYNAMIC') || (e as any)?.message?.includes('dynamic') || (e as any)?.message?.includes('bailout')) {
                    throw e;
                  }
                }
                
                // If we're still here, noStore didn't stop us or was caught.
                // We MUST force a bailout that Next.js recognizes.
                const bailoutError = new Error("Dynamic Server Usage: Prisma query during build without DATABASE_URL");
                (bailoutError as any).digest = 'DYNAMIC_SERVER_USAGE';
                throw bailoutError;
              }
              return method.apply(modelTarget, args);
            };
          }
          return method;
        }
      });
    }

    // Wrap top-level Prisma methods like $queryRaw, $executeRaw, $transaction
    if (typeof value === 'function' && prop.startsWith('$')) {
      return (...args: any[]) => {
        if (typeof window === 'undefined' && !process.env.DATABASE_URL) {
          try {
            noStore();
          } catch (e) {
            if ((e as any)?.digest?.includes('DYNAMIC') || (e as any)?.message?.includes('dynamic') || (e as any)?.message?.includes('bailout')) {
              throw e;
            }
          }
          
          const bailoutError = new Error("Dynamic Server Usage: Prisma query during build without DATABASE_URL");
          (bailoutError as any).digest = 'DYNAMIC_SERVER_USAGE';
          throw bailoutError;
        }
        return value.apply(target, args);
      };
    }
    
    return value;
  }
});

export const prisma = prismaProxy as unknown as PrismaClient;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = clientWithDelegate;
}

