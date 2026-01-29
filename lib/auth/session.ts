import { cookies } from 'next/headers';
import type { SessionUser } from '@/types';

export async function getCurrentUser(): Promise<SessionUser | null> {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('neon_auth_session');
        const userCookie = cookieStore.get('neon_auth_user');

        if (!sessionToken?.value) {
            return null;
        }

        // Parse user info from cookie
        if (userCookie?.value) {
            try {
                const user = JSON.parse(userCookie.value);
                const email = user.email || '';

                // Check if user is admin based on ADMIN_EMAILS
                const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
                const isAdminUser = adminEmails.includes(email.toLowerCase());

                return {
                    id: user.id || 'user-id',
                    email: email,
                    role: isAdminUser ? 'super_admin' : 'student',
                };
            } catch {
                return null;
            }
        }

        // Fallback if no user cookie but session exists
        return {
            id: 'user-id',
            email: 'user@example.com',
            role: 'student',
        };
    } catch {
        return null;
    }
}

export function isAdmin(role: string): boolean {
    return ['content_admin', 'super_admin', 'faculty_reviewer'].includes(role);
}

export function canReview(role: string): boolean {
    return ['content_admin', 'super_admin', 'faculty_reviewer'].includes(role);
}

export function canPublish(role: string): boolean {
    return ['content_admin', 'super_admin'].includes(role);
}

export function canManageUsers(role: string): boolean {
    return role === 'super_admin';
}

export function isAdminEmail(email: string): boolean {
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    return adminEmails.includes(email.toLowerCase());
}
