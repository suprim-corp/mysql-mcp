import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppConfig } from "../config/index.js";
import { executeQuery } from "../db/query.js";

export function registerExecuteSql(server: McpServer, config: AppConfig): void {
    server.tool(
        "execute_sql",
        "Execute SQL queries against the database. Multiple statements can be separated by semicolons. Permissions are enforced based on the configured role.",
        {
            query: z
                .string()
                .describe("SQL query or queries separated by semicolons"),
        },
        async ({ query }) => {
            try {
                const results = await executeQuery(query, config.role);
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
