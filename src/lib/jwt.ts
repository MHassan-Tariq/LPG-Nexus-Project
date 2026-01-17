import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "a-string-secret-at-least-256-bits-long";
const JWT_SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  username?: string | null;
  role?: string;
  adminId?: string | null; // For multi-tenant: Admin's ID (tenant owner)
  [key: string]: any;
}

/**
 * Generate a JWT token for a user
 * expiresIn format: "24h", "30d", "60m", "3600s" or numeric seconds
 */
export async function signToken(payload: JWTPayload, expiresIn: string = "24h"): Promise<string> {
  // Convert expiresIn to a Date for jose
  const expirationDate = getExpirationDate(expiresIn);
  
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("lpg-nexus")
    .setExpirationTime(expirationDate)
    .sign(JWT_SECRET_KEY);

  return jwt;
}

/**
 * Convert expiresIn string to Date
 * Supports formats like: "24h", "30d", "60m", "3600s"
 */
function getExpirationDate(expiresIn: string): Date {
  let seconds = 24 * 60 * 60; // Default 24 hours

  // Handle numeric strings (seconds)
  if (/^\d+$/.test(expiresIn)) {
    seconds = parseInt(expiresIn, 10);
  } else {
    const match = expiresIn.match(/^(\d+)([hdms])$/);
    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2];

      switch (unit) {
        case "d":
          seconds = value * 24 * 60 * 60;
          break;
        case "h":
          seconds = value * 60 * 60;
          break;
        case "m":
          seconds = value * 60;
          break;
        case "s":
          seconds = value;
          break;
      }
    }
  }

  return new Date(Date.now() + seconds * 1000);
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_KEY, {
      issuer: "lpg-nexus",
    });

    return payload as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Get the current user from the JWT token in cookies
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return null;
    }

    return await verifyToken(token);
  } catch (error: any) {
    // If it's a dynamic server usage error from Next.js, rethrow it
    // so Next.js can correctly handle dynamic bailout during build
    if (error?.digest === 'DYNAMIC_SERVER_USAGE' || error?.message?.includes('dynamic-server-error')) {
      throw error;
    }
    return null;
  }
}

/**
 * Set JWT token in HTTP-only cookie
 */
export async function setAuthToken(
  payload: JWTPayload,
  rememberMe: boolean = false,
): Promise<void> {
  const expiresIn = rememberMe ? "30d" : "24h";
  const token = await signToken(payload, expiresIn);

  const cookieStore = await cookies();
  const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // 30 days or 1 day

  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });
}

/**
 * Clear JWT token from cookies
 */
export async function clearAuthToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("token");
}

