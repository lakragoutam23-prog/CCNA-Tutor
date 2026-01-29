import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
    const { db } = await import('@/lib/db');
    const { users } = await import('@/lib/db/schema');

    console.log('Fetching all users from database...');

    const allUsers = await db.select().from(users);

    console.log(`Found ${allUsers.length} users:`);
    allUsers.forEach((u, i) => {
        console.log(`${i + 1}. ${u.email} | Role: ${u.role} | Created: ${u.createdAt}`);
    });

    process.exit(0);
}

main().catch(console.error);
