import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();

        // Check for our local session cookie
        const sessionToken = cookieStore.get('neon_auth_session');
        const userCookie = cookieStore.get('neon_auth_user');

        if (!sessionToken?.value) {
            return NextResponse.json({
                success: false,
                error: 'No session found'
            }, { status: 401 });
        }

        // Parse user info from cookie
        let user = { email: 'user@example.com', id: 'user-id', name: 'User' };
        if (userCookie?.value) {
            try {
                user = JSON.parse(userCookie.value);
            } catch { }
        }

        // Use role from cookie (set by signin route from DB)
        const role = (user as any).role || 'student';

        return NextResponse.json({
            success: true,
            data: {
                id: user.id || 'user-id',
                email: user.email,
                role: role,
                name: user.name || user.email?.split('@')[0]
            }
        });
    } catch (error) {
        console.error('Session check error:', error);
        return NextResponse.json({
            success: false,
            error: 'Session check failed'
        }, { status: 500 });
    }
}
