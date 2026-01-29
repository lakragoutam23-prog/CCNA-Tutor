import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const NEON_AUTH_URL = process.env.NEON_AUTH_BASE_URL || 'https://ep-wandering-hill-ah66iehg.neonauth.c-3.us-east-1.aws.neon.tech/neondb/auth';
// Use hardcoded localhost for origin to pass check, as this is a server-side administrative script
const ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';

export async function GET(request: NextRequest) {
    try {
        const email = 'admin@CCNA.com';
        const password = 'adminCCNA';
        const name = 'Admin';

        // 1. Create User directly in Neon Auth (skip local proxy to avoid deadlock)
        console.log('Attempting to create admin user via Neon Auth direct API...');

        const response = await fetch(`${NEON_AUTH_URL}/sign-up/email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': ORIGIN // Essential for Neon Auth
            },
            body: JSON.stringify({
                email,
                password,
                name,
                callbackURL: `${ORIGIN}/learn`,
            }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            console.log('Neon Auth response not OK:', data);
            // Ignore "already exists" errors, we just want to ensure they exist so we can promote them
            if (!JSON.stringify(data).includes('already exists') && response.status !== 409) {
                return NextResponse.json({
                    success: false,
                    step: 'neon_create',
                    error: data.message || data.error || 'Failed to create user in Neon Auth'
                }, { status: 400 });
            }
        }

        // 2. Poll DB for user to appear (Neon Auth syncs to DB, might take a moment)
        // We'll try 3 times with 1s delay
        let user = null;
        for (let i = 0; i < 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const [found] = await db
                .select()
                .from(users)
                .where(eq(users.email, email.toLowerCase()))
                .limit(1);

            if (found) {
                user = found;
                break;
            }
        }

        if (!user) {
            // If manual sync failed or took too long, try one last fetch or just error
            // It's possible the user created it manually before calling this
            const [found] = await db
                .select()
                .from(users)
                .where(eq(users.email, email.toLowerCase()))
                .limit(1);
            user = found;
        }

        // 3. Force Admin Role
        if (user) {
            await db
                .update(users)
                .set({ role: 'super_admin' })
                .where(eq(users.id, user.id));

            return NextResponse.json({
                success: true,
                message: 'Admin user configured and promoted successfully!',
                user: {
                    id: user.id,
                    email: user.email,
                    role: 'super_admin'
                }
            });
        } else {
            return NextResponse.json({
                success: false,
                error: 'User created in Auth but not found in DB yet. Please refresh this page in a few seconds.'
            }, { status: 404 });
        }

    } catch (error) {
        console.error('Setup admin error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
