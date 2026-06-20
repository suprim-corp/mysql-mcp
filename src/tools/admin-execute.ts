import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppConfig } from "../config/index.js";
import { SqlOperation, validateAllowedOps } from "../config/permissions.js";
import { executeDDL } from "../db/query.js";

const ALLOWED_OPS = new Set([
    SqlOperation.CREATE,
    SqlOperation.ALTER,
    SqlOperation.DROP,
    SqlOperation.TRUNCATE,
]);

export function registerAdminExecute(
    server: McpServer,
    config: AppConfig,
): void {
    server.tool(
        "admin_execute",
        "Execute DDL statements (CREATE, ALTER, DROP, TRUNCATE). Use dry_run to preview parsed operations without executing.",
        {
            sql: z
                .string()
                .describe("DDL statement(s) separated by semicolons"),
            dry_run: z
                .boolean()
                .optional()
                .default(false)
                .describe(
                    "If true, shows what would be executed without running",
                ),
        },
        async ({ sql, dry_run }) => {
            try {
                validateAllowedOps(sql, ALLOWED_OPS);
                const results = await executeDDL(sql, dry_run);
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
