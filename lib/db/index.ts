import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Handle build-time absence of DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;

let sql: NeonQueryFunction<false, false>;
let db: NeonHttpDatabase<typeof schema>;

if (databaseUrl) {
    sql = neon(databaseUrl);
    db = drizzle(sql, { schema });
} else {
    // Provide a dummy during build
    sql = (() => Promise.resolve([])) as any;
    db = {} as any;
}

export { db, sql };
export * from './schema';
