import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
    conn: Pool | undefined;
};

const conn = globalForDb.conn ?? new Pool({
    connectionString: process.env.DATABASE_URL!,
    max: 10,                        // 最大连接数
    idleTimeoutMillis: 30000,       // 空闲连接超时 30 秒
    connectionTimeoutMillis: 10000, // 连接超时 10 秒
});

if (process.env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle(conn, { schema });
