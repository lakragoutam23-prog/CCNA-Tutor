import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        const cookieStore = await cookies();

        // Clear all possible auth cookies
        const authCookies = [
            'better-auth.session_token',
            'neon_auth_session',
            '__session',
            'session'
        ];

        for (const name of authCookies) {
            cookieStore.delete(name);
        }

        return NextResponse.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json({
            success: false,
            error: 'Logout failed'
        }, { status: 500 });
    }
}
