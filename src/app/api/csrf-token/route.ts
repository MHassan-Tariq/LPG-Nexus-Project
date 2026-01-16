/**
 * CSRF Token Endpoint
 * 
 * Provides CSRF token for client-side use.
 */

import { NextResponse } from 'next/server';
import { getCsrfToken } from '@/lib/csrf';
import { createSecureResponse } from '@/lib/security-headers';

export async function GET() {
  const token = await getCsrfToken();

  return createSecureResponse({
    token,
  });
}

