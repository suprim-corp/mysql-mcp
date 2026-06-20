import type { RowDataPacket, ResultSetHeader, OkPacket } from "mysql2/promise";
import { getPool } from "./pool.js";
import { checkPermissions, type Role } from "../config/permissions.js";

export interface QueryResult {
    columns?: string[];
    rows?: Record<string, unknown>[];
    affectedRows?: number;
    message?: string;
}

export async function executeQuery(
    sql: string,
    role: Role,
): Promise<QueryResult[]> {
    checkPermissions(sql, role);

    const pool = getPool();
    const statements = sql
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);

    const results: QueryResult[] = [];

    for (const stmt of statements) {
        const [result, fields] = await pool.query(stmt);

        if (Array.isArray(result) && fields) {
            const rows = result as RowDataPacket[];
            const columns = fields.map((f) => f.name);
            results.push({ columns, rows: rows as Record<string, unknown>[] });
        } else {
            const header = result as ResultSetHeader | OkPacket;
            results.push({
                affectedRows: header.affectedRows,
                message: `OK, ${header.affectedRows} row(s) affected`,
            });
        }
    }

    return results;
}
