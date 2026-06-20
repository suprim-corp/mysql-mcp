import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppConfig } from "../config/index.js";
import { getPool } from "../db/pool.js";

export function registerGetDbHealthIndexUsage(
    server: McpServer,
    config: AppConfig,
): void {
    server.tool(
        "get_db_health_index_usage",
        "Analyze index performance: find redundant, unused, and poorly-performing indexes.",
        {},
        async () => {
            try {
                const pool = getPool();
                const diagnostics: Record<string, unknown> = {};

                // Redundant indexes (never used)
                try {
                    const [redundant] = await pool.query(
                        `SELECT object_schema, object_name, index_name, count_star
             FROM performance_schema.table_io_waits_summary_by_index_usage
             WHERE object_schema = ? AND index_name IS NOT NULL AND count_star = 0
             ORDER BY object_name, index_name`,
                        [config.db.database],
                    );
                    diagnostics.redundantIndexes = redundant;
                } catch {
                    diagnostics.redundantIndexes =
                        "Requires performance_schema enabled";
                }

                // Slow indexes (high wait time)
                try {
                    const [slow] = await pool.query(
                        `SELECT object_schema, object_name, index_name, count_star,
                    ROUND(sum_timer_wait / 1000000000, 2) AS total_wait_ms,
                    ROUND(max_timer_wait / 1000000000, 2) AS max_wait_ms
             FROM performance_schema.table_io_waits_summary_by_index_usage
             WHERE object_schema = ? AND index_name IS NOT NULL AND count_star > 0
             ORDER BY max_timer_wait DESC
             LIMIT 20`,
                        [config.db.database],
                    );
                    diagnostics.slowIndexes = slow;
                } catch {
                    diagnostics.slowIndexes =
                        "Requires performance_schema enabled";
                }

                // Tables with no indexes being used
                try {
                    const [unused] = await pool.query(
                        `SELECT object_schema, object_name,
                    ROUND(sum_timer_wait / 1000000000, 2) AS total_wait_ms,
                    count_star
             FROM performance_schema.table_io_waits_summary_by_index_usage
             WHERE object_schema = ? AND index_name IS NULL AND count_star > 0
             ORDER BY sum_timer_wait DESC
             LIMIT 10`,
                        [config.db.database],
                    );
                    diagnostics.fullTableScans = unused;
                } catch {
                    diagnostics.fullTableScans =
                        "Requires performance_schema enabled";
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(diagnostics, null, 2),
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
