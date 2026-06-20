import type { RowDataPacket, ResultSetHeader, OkPacket } from "mysql2/promise";
import { getPool } from "./pool.js";

export interface QueryResult {
    columns?: string[];
    rows?: Record<string, unknown>[];
    affectedRows?: number;
    message?: string;
}

const LIMIT_PATTERN = /\bLIMIT\s+\d+/i;

function splitStatements(sql: string): string[] {
    return sql
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);
}

export async function executeReadOnly(
    sql: string,
    rowLimit = 1000,
): Promise<QueryResult[]> {
    const pool = getPool();
    const statements = splitStatements(sql);
    const results: QueryResult[] = [];

    for (const stmt of statements) {
        let execStmt = stmt;
        if (
            rowLimit > 0 &&
            stmt.toUpperCase().trimStart().startsWith("SELECT") &&
            !LIMIT_PATTERN.test(stmt)
        ) {
            execStmt = `${stmt} LIMIT ${rowLimit}`;
        }

        const [result, fields] = await pool.query(execStmt);

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

export async function executeMutation(
    sql: string,
    dryRun = false,
): Promise<QueryResult[]> {
    const pool = getPool();
    const statements = splitStatements(sql);

    if (dryRun) {
        const results: QueryResult[] = [];
        for (const stmt of statements) {
            const [result, fields] = await pool.query(`EXPLAIN ${stmt}`);
            if (Array.isArray(result) && fields) {
                const rows = result as RowDataPacket[];
                const columns = fields.map((f) => f.name);
                results.push({
                    columns,
                    rows: rows as Record<string, unknown>[],
                });
            }
        }
        return results;
    }

    const conn = await pool.getConnection();
    const results: QueryResult[] = [];
    try {
        await conn.beginTransaction();
        for (const stmt of statements) {
            const [result] = await conn.query(stmt);
            const header = result as ResultSetHeader | OkPacket;
            results.push({
                affectedRows: header.affectedRows,
                message: `OK, ${header.affectedRows} row(s) affected`,
            });
        }
        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }

    return results;
}

export async function executeDDL(
    sql: string,
    dryRun = false,
): Promise<QueryResult[]> {
    const statements = splitStatements(sql);

    if (dryRun) {
        return statements.map((stmt) => ({
            message: `Would execute: ${stmt}`,
        }));
    }

    const pool = getPool();
    const results: QueryResult[] = [];

    for (const stmt of statements) {
        await pool.query(stmt);
        results.push({ message: `OK: ${stmt.split(/\s+/).slice(0, 3).join(" ")}...` });
    }

    return results;
}
