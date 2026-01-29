import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const NEON_AUTH_URL = process.env.NEON_AUTH_BASE_URL || 'https://ep-wandering-hill-ah66iehg.neonauth.c-3.us-east-1.aws.neon.tech/neondb/auth';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email and password required' },
                { status: 400 }
            );
        }

        console.log(`[signin] Attempting sign-in for: ${email}`);
        console.log(`[signin] Calling Neon Auth at: ${NEON_AUTH_URL}/sign-in/email`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch(`${NEON_AUTH_URL}/sign-in/email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': APP_URL,
                },
                body: JSON.stringify({
                    email,
                    password,
                    callbackURL: `${APP_URL}/learn`,
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            console.log(`[signin] Neon Auth response status: ${response.status}`);

            const data = await response.json().catch(() => ({}));
            console.log(`[signin] Neon Auth response data:`, JSON.stringify(data).slice(0, 200));

            if (!response.ok) {
                return NextResponse.json(
                    { success: false, error: data.message || data.error || 'Invalid email or password' },
                    { status: response.status }
                );
            }

            // SYNC USER TO LOCAL DATABASE (upsert on login)
            try {
                const userEmail = (data.user?.email || email).toLowerCase();
                const userName = data.user?.name || email.split('@')[0];

                // Check if user exists in local DB
                const [existingUser] = await db
                    .select()
                    .from(users)
                    .where(eq(users.email, userEmail))
                    .limit(1);

                if (!existingUser) {
                    // Create user in local DB during login (for users created before this fix)
                    const userId = data.user?.id || `user_${Date.now()}`;
                    await db.insert(users).values({
                        id: userId,
                        email: userEmail,
                        name: userName,
                        role: 'student',
                    });
                    console.log(`[signin] Created missing user in local DB: ${userEmail}`);
                }
            } catch (dbError) {
                console.error('[signin] Failed to sync user to local DB:', dbError);
                // Continue - don't fail signin if DB sync fails
            }

            // Set session cookies
            const cookieStore = await cookies();
            const sessionToken = data.token || data.session?.token || `neon_${Date.now()}_${Math.random().toString(36)}`;

            cookieStore.set('neon_auth_session', sessionToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7,
                path: '/',
            });

            cookieStore.set('neon_auth_user', JSON.stringify({
                email: data.user?.email || email,
                id: data.user?.id || 'user-id',
                name: data.user?.name || email.split('@')[0],
            }), {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7,
                path: '/',
            });

            // Check if user is admin for redirect
            const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
            const isAdmin = adminEmails.includes(email.toLowerCase());
            const redirectUrl = isAdmin ? '/dashboard' : '/learn';

            console.log(`[signin] Success! User is admin: ${isAdmin}. Redirecting to ${redirectUrl}`);
            return NextResponse.json({
                success: true,
                user: data.user || { email },
                redirectUrl,
            });

        } catch (fetchError: any) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError') {
                console.error('[signin] Request timed out after 10s');
                return NextResponse.json(
                    { success: false, error: 'Authentication service timed out. Please try again.' },
                    { status: 504 }
                );
            }
            throw fetchError;
        }

    } catch (error) {
        console.error('[signin] Error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Sign in failed' },
            { status: 500 }
        );
    }
}
