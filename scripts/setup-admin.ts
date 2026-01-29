import { config } from 'dotenv';
config({ path: '.env.local' });

const { db } = require('@/lib/db');
const { users } = require('@/lib/db/schema');
const { eq } = require('drizzle-orm');

const NEON_AUTH_URL = process.env.NEON_AUTH_BASE_URL || 'https://ep-wandering-hill-ah66iehg.neonauth.c-3.us-east-1.aws.neon.tech/neondb/auth';
const ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';

async function main() {
    const email = 'admin@CCNA.com';
    const password = 'adminCCNA';
    const name = 'Admin';

    console.log(`Setting up admin user: ${email}...`);

    try {
        // 1. Create in Neon Auth
        console.log('Creating user in Neon Auth...');
        const response = await fetch(`${NEON_AUTH_URL}/sign-up/email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': ORIGIN
            },
            body: JSON.stringify({
                email,
                password,
                name,
                callbackURL: `${ORIGIN}/learn`,
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            if (text.includes('already exists') || response.status === 409) {
                console.log('User already exists in Neon Auth. Proceeding to role update...');
            } else {
                console.error('Failed to create user:', Promise.resolve(text));
            }
        } else {
            console.log('User created successfully in Neon Auth.');
        }

        // 2. Wait for DB sync (Neon Auth -> Postgres)
        console.log('Waiting for database sync...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 3. Update Role
        console.log('Updating role in database...');
        // Poll for user
        for (let i = 0; i < 5; i++) {
            const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
            if (user) {
                await db.update(users).set({ role: 'super_admin' }).where(eq(users.id, user.id));
                console.log('✅ Success! User updated to super_admin.');
                process.exit(0);
            }
            console.log(`User not found yet, retrying (${i + 1}/5)...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.error('❌ User not found in database after multiple retries.');
        process.exit(1);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
