
// This file will be deleted as Supabase middleware is no longer needed.
// If you have other middleware logic here, ensure it's still relevant.
// For now, we'll make it an empty export to prevent build errors if referenced elsewhere.

import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Placeholder if other middleware logic is added in the future
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
