import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppConfig } from "../config/index.js";
import { getPool } from "../db/pool.js";

export function registerGetTableIndex(
    server: McpServer,
    config: AppConfig,
): void {
    server.tool(
        "get_table_index",
        "Get index information for one or more tables (name, columns, uniqueness, type).",
        { tables: z.string().describe("Comma-separated table names") },
        async ({ tables }) => {
            try {
                const pool = getPool();
                const tableNames = tables
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean);
                const placeholders = tableNames.map(() => "?").join(",");

                const [rows] = await pool.query(
                    `SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX, NON_UNIQUE, INDEX_TYPE, NULLABLE
           FROM information_schema.STATISTICS
           WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (${placeholders})
           ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX`,
                    [config.db.database, ...tableNames],
                );

                return {
                    content: [
                        { type: "text", text: JSON.stringify(rows, null, 2) },
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
