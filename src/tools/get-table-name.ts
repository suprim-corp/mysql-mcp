import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppConfig } from "../config/index.js";
import { getPool } from "../db/pool.js";

export function registerGetTableName(
    server: McpServer,
    config: AppConfig,
): void {
    server.tool(
        "get_table_name",
        "Search for tables by comment/description keyword. Returns matching table names and their comments.",
        { keyword: z.string().describe("Keyword to search in table comments") },
        async ({ keyword }) => {
            try {
                const pool = getPool();
                const [rows] = await pool.query(
                    `SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_COMMENT
           FROM information_schema.TABLES
           WHERE TABLE_SCHEMA = ? AND TABLE_COMMENT LIKE ?
           ORDER BY TABLE_NAME`,
                    [config.db.database, `%${keyword}%`],
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
