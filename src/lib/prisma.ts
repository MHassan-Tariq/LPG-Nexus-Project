import { PrismaClient } from "@prisma/client";
import { unstable_noStore as noStore } from 'next/cache';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more:
// https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Diagnostic logging for DATABASE_URL (masked for security)
if (typeof window === 'undefined') {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error(" [Prisma Initialization] CRITICAL: DATABASE_URL is NOT defined in the environment.");
  } else {
    const maskedUrl = dbUrl.length > 20 
      ? dbUrl.substring(0, 10) + "..." + dbUrl.substring(dbUrl.length - 10)
      : "***";
    console.log(` [Prisma Initialization] DATABASE_URL is defined (Value: ${maskedUrl})`);
  }
}

function createPrismaClient() {
  return new PrismaClient({
    log: ["warn", "error"],
  });
}

const client = globalForPrisma.prisma ?? createPrismaClient();

/**
 * Detect if we are in the Build/Static Generation phase
 */
function isBuildPhase() {
  // NEXT_PHASE is set to 'phase-production-build' during next build
  return process.env.NEXT_PHASE === 'phase-production-build' || 
         (typeof window === 'undefined' && !process.env.DATABASE_URL && process.env.VERCEL === '1');
}

// Create a fail-safe proxy for the Prisma client
// This ensures that any attempt to use Prisma during build without DATABASE_URL
// triggers a dynamic bailout instead of a build error
const prismaProxy = new Proxy(client, {
  get(target: any, prop: string) {
    const value = target[prop];
    
    // Check if we're accessing a model (e.g., prisma.user) or top-level Prisma methods like $queryRaw
    const isModel = value && typeof value === 'object' && prop !== 'constructor' && !prop.startsWith('$');
    const isTopLevelMethod = typeof value === 'function' && prop.startsWith('$');

    if (isModel) {
      return new Proxy(value, {
        get(modelTarget: any, modelProp: string) {
          const method = modelTarget[modelProp];
          
          if (typeof method === 'function') {
            return (...args: any[]) => {
              if (typeof window === 'undefined' && !process.env.DATABASE_URL) {
                if (isBuildPhase()) {
                  try {
                    noStore();
                  } catch (e: any) {
                    if (e?.digest?.includes('DYNAMIC') || e?.message?.includes('dynamic') || e?.message?.includes('bailout')) {
                      throw e;
                    }
                  }
                  const bailoutError = new Error("Dynamic Server Usage: Prisma query during build without DATABASE_URL");
                  (bailoutError as any).digest = 'DYNAMIC_SERVER_USAGE';
                  throw bailoutError;
                } else {
                  // If we are NOT in build phase but DB URL is missing, it's a runtime config error.
                  // Throw a regular error so it's logged clearly as a 500.
                  throw new Error("Runtime Error: DATABASE_URL is missing. Please check your Vercel Environment Variables.");
                }
              }
              return method.apply(modelTarget, args);
            };
          }
          return method;
        }
      });
    }

    if (isTopLevelMethod) {
      return (...args: any[]) => {
        if (typeof window === 'undefined' && !process.env.DATABASE_URL) {
          if (isBuildPhase()) {
            try {
              noStore();
            } catch (e: any) {
              if (e?.digest?.includes('DYNAMIC') || e?.message?.includes('dynamic') || e?.message?.includes('bailout')) {
                throw e;
              }
            }
            const bailoutError = new Error("Dynamic Server Usage: Prisma query during build without DATABASE_URL");
            (bailoutError as any).digest = 'DYNAMIC_SERVER_USAGE';
            throw bailoutError;
          } else {
            throw new Error("Runtime Error: DATABASE_URL is missing. Please check your Vercel Environment Variables.");
          }
        }
        return value.apply(target, args);
      };
    }
    
    return value;
  }
});

export const prisma = prismaProxy as unknown as PrismaClient;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = client;
}

