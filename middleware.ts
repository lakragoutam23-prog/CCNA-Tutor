import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/', '/login', '/api/auth', '/api/health', '/api/ready'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public paths and auth routes
    if (publicPaths.some(path => pathname === path || pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // Allow static assets
    if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon') || pathname.includes('.')) {
        return NextResponse.next();
    }

    // Check for our local session cookie
    const sessionCookie = request.cookies.get('neon_auth_session');

    // Check authentication
    if (!sessionCookie?.value) {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|public).*)',
    ],
};
