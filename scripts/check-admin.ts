import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is missing in env!');
        process.exit(1);
    }

    // Dynamic import to ensure env vars are loaded first
    const { db } = await import('@/lib/db');
    const { users } = await import('@/lib/db/schema');
    const { eq } = await import('drizzle-orm');

    const email = 'admin@CCNA.com';
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));

    if (user) {
        console.log(`User found: ${user.email}, Role: ${user.role}`);
    } else {
        console.log('User NOT found.');
    }
    process.exit(0);
}

main().catch(console.error);
