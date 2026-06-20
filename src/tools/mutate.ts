import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppConfig } from "../config/index.js";
import { SqlOperation, validateAllowedOps } from "../config/permissions.js";
import { executeMutation } from "../db/query.js";

const ALLOWED_OPS = new Set([
    SqlOperation.INSERT,
    SqlOperation.UPDATE,
    SqlOperation.DELETE,
]);

export function registerMutate(server: McpServer, config: AppConfig): void {
    server.tool(
        "mutate",
        "Execute data modification SQL (INSERT, UPDATE, DELETE). Multiple statements are wrapped in a transaction. Use dry_run to preview with EXPLAIN instead of executing.",
        {
            sql: z
                .string()
                .describe(
                    "SQL mutation statement(s) separated by semicolons",
                ),
            dry_run: z
                .boolean()
                .optional()
                .default(false)
                .describe(
                    "If true, returns EXPLAIN output instead of executing",
                ),
        },
        async ({ sql, dry_run }) => {
            try {
                validateAllowedOps(sql, ALLOWED_OPS);
                const results = await executeMutation(sql, dry_run);
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
