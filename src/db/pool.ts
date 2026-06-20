import mysql from "mysql2/promise";
import type { DbConfig } from "../config/index.js";

let pool: mysql.Pool | null = null;

export function initPool(config: DbConfig): void {
    pool = mysql.createPool({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        connectionLimit: config.connectionLimit,
        idleTimeout: config.idleTimeout,
        multipleStatements: true,
        waitForConnections: true,
    });
}

export function getPool(): mysql.Pool {
    if (!pool) throw new Error("Database pool not initialized");
    return pool;
}

export async function closePool(): Promise<void> {
    if (pool) {
        await pool.end();
        pool = null;
    }
}
