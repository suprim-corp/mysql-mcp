import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppConfig } from "../config/index.js";
import type { RowDataPacket } from "mysql2/promise";
import { getPool } from "../db/pool.js";

export function registerExplainQuery(
    server: McpServer,
    config: AppConfig,
): void {
    server.tool(
        "explain_query",
        "Analyze a SQL query for optimization. Returns the EXPLAIN plan, relevant table schemas, indexes, and row counts to help identify performance issues.",
        { sql: z.string().describe("The SQL query to analyze") },
        async ({ sql }) => {
            try {
                const pool = getPool();
                const analysis: Record<string, unknown> = {};

                const [explainResult] = await pool.query(`EXPLAIN ${sql}`);
                analysis.explainPlan = explainResult;

                const tableNames = extractTableNames(sql);

                if (tableNames.length > 0) {
                    const placeholders = tableNames.map(() => "?").join(",");

                    const [tableSizes] = await pool.query<RowDataPacket[]>(
                        `SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH,
                    ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS total_size_mb
             FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (${placeholders})`,
                        [config.db.database, ...tableNames],
                    );
                    analysis.tableSizes = tableSizes;

                    const [indexes] = await pool.query(
                        `SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX, NON_UNIQUE, INDEX_TYPE
             FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (${placeholders})
             ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX`,
                        [config.db.database, ...tableNames],
                    );
                    analysis.indexes = indexes;

                    const [columns] = await pool.query(
                        `SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, COLUMN_KEY
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (${placeholders})
             ORDER BY TABLE_NAME, ORDINAL_POSITION`,
                        [config.db.database, ...tableNames],
                    );
                    analysis.columns = columns;
                }

                analysis.originalSql = sql;

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(analysis, null, 2),
                        },
                    ],
                };
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : String(err);
                return {
                    content: [{ type: "text", text: `Error: ${message}` }],
                    isError: true,
                };
            }
        },
    );
}

const SQL_KEYWORDS = new Set([
    "SELECT",
    "FROM",
    "WHERE",
    "JOIN",
    "LEFT",
    "RIGHT",
    "INNER",
    "OUTER",
    "CROSS",
    "ON",
    "AND",
    "OR",
    "NOT",
    "IN",
    "EXISTS",
    "BETWEEN",
    "LIKE",
    "ORDER",
    "BY",
    "GROUP",
    "HAVING",
    "LIMIT",
    "OFFSET",
    "UNION",
    "ALL",
    "INSERT",
    "INTO",
    "VALUES",
    "UPDATE",
    "SET",
    "DELETE",
    "AS",
    "DISTINCT",
    "CASE",
    "WHEN",
    "THEN",
    "ELSE",
    "END",
    "NULL",
    "IS",
    "WITH",
    "RECURSIVE",
]);

function extractTableNames(sql: string): string[] {
    const cleaned = sql
        .replace(/--.*$/gm, "")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/`/g, "");

    const tables = new Set<string>();

    const pattern = /\b(?:FROM|JOIN)\s+(\w+)/gi;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(cleaned)) !== null) {
        const name = match[1].toUpperCase();
        if (!SQL_KEYWORDS.has(name)) {
            tables.add(match[1]);
        }
    }

    return [...tables];
}
