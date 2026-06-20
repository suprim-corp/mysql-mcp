import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppConfig } from "../config/index.js";
import { SqlOperation, validateAllowedOps } from "../config/permissions.js";
import { executeReadOnly } from "../db/query.js";

const ALLOWED_OPS = new Set([
    SqlOperation.SELECT,
    SqlOperation.SHOW,
    SqlOperation.DESCRIBE,
    SqlOperation.EXPLAIN,
]);

export function registerQuery(server: McpServer, config: AppConfig): void {
    server.tool(
        "query",
        "Execute read-only SQL queries (SELECT, SHOW, DESCRIBE, EXPLAIN). Multiple statements separated by semicolons. Returns up to row_limit rows per SELECT (default 1000, set 0 for unlimited).",
        {
            sql: z
                .string()
                .describe(
                    "Read-only SQL query or queries separated by semicolons",
                ),
            row_limit: z
                .number()
                .optional()
                .default(1000)
                .describe(
                    "Max rows per SELECT statement. 0 for unlimited.",
                ),
        },
        async ({ sql, row_limit }) => {
            try {
                validateAllowedOps(sql, ALLOWED_OPS);
                const results = await executeReadOnly(sql, row_limit);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(results, null, 2),
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
