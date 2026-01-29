import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';

config();

async function runMigration() {
    const sql = neon(process.env.DATABASE_URL!);

    // Read the SQL file
    const migrationPath = join(process.cwd(), 'drizzle', '0000_dazzling_epoch.sql');
    let sqlContent = readFileSync(migrationPath, 'utf-8');

    // Fix empty array defaults (syntax error in generated SQL)
    sqlContent = sqlContent.replace(/DEFAULT \,/g, "DEFAULT '{}'::text[],");
    sqlContent = sqlContent.replace(/DEFAULT \n\)/g, "DEFAULT '{}'::uuid[]\n)");

    // Split by statement breakpoint (use regex for the comment pattern)
    const statements = sqlContent.split(/-->\s*statement-breakpoint/).map(s => s.trim()).filter(Boolean);

    console.log(`Running ${statements.length} migration statements...`);

    let success = 0;
    let failed = 0;

    for (let i = 0; i < statements.length; i++) {
        let stmt = statements[i].trim();
        if (!stmt) continue;

        try {
            await sql(stmt);
            success++;
            if ((i + 1) % 10 === 0) {
                console.log(`✓ Completed ${i + 1}/${statements.length}`);
            }
        } catch (err: any) {
            if (err.message?.includes('already exists') || err.message?.includes('duplicate')) {
                success++;
            } else {
                console.error(`✗ Statement ${i + 1} failed:`, err.message?.substring(0, 100));
                failed++;
            }
        }
    }

    console.log(`\n✅ Migration complete! Success: ${success}, Failed: ${failed}`);
}

runMigration().catch(console.error);
