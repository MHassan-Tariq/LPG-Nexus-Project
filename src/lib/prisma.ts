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
    console.warn(" [Prisma Initialization] DATABASE_URL is NOT defined in the environment.");
  } else {
    const maskedUrl = dbUrl.length > 10 
      ? dbUrl.substring(0, 5) + "..." + dbUrl.substring(dbUrl.length - 5)
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
              // Build-time safety: 
              // If we're on the server during BUILD (no DATABASE_URL), trigger a bailout.
              // We check process.env.NEXT_PHASE to be more precise if possible, 
              // but DATABASE_URL missing on server is a strong indicator of static generation phase on Vercel.
              if (typeof window === 'undefined' && !process.env.DATABASE_URL) {
                // IMPORTANT: Only throw dynamic bailout if we are NOT in production runtime. 
                // Vercel build environment usually doesn't have DATABASE_URL.
                try {
                  noStore();
                } catch (e: any) {
                  // If it's a dynamic bailout error, rethrow it
                  if (e?.digest?.includes('DYNAMIC') || e?.message?.includes('dynamic') || e?.message?.includes('bailout')) {
                    throw e;
                  }
                }
                
                // Final safety: Force a bailout that Next.js recognizes during build.
                // We use a custom property to avoid interference with runtime 500s.
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

    if (isTopLevelMethod) {
      return (...args: any[]) => {
        if (typeof window === 'undefined' && !process.env.DATABASE_URL) {
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

