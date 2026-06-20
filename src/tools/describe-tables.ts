import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppConfig } from "../config/index.js";
import { getPool } from "../db/pool.js";

export function registerDescribeTables(
    server: McpServer,
    config: AppConfig,
): void {
    server.tool(
        "describe_tables",
        "Get column structure for one or more tables (name, type, nullable, default, comment).",
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
                    `SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT, ORDINAL_POSITION
           FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (${placeholders})
           ORDER BY TABLE_NAME, ORDINAL_POSITION`,
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
