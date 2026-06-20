import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppConfig } from "../config/index.js";
import { getPool } from "../db/pool.js";

export function registerShowLocks(
    server: McpServer,
    _config: AppConfig,
): void {
    server.tool(
        "show_locks",
        "Diagnose current table and row-level locks. Supports both MySQL 5.x and 8.x.",
        {},
        async () => {
            try {
                const pool = getPool();
                const diagnostics: Record<string, unknown> = {};

                const [openTables] = await pool.query(
                    `SHOW OPEN TABLES WHERE In_use > 0`,
                );
                diagnostics.openTablesInUse = openTables;

                try {
                    const [lockWaits] = await pool.query(
                        `SELECT
               r.trx_id AS waiting_trx_id,
               r.trx_mysql_thread_id AS waiting_thread,
               r.trx_query AS waiting_query,
               b.trx_id AS blocking_trx_id,
               b.trx_mysql_thread_id AS blocking_thread,
               b.trx_query AS blocking_query
             FROM performance_schema.data_lock_waits w
             JOIN information_schema.INNODB_TRX r ON r.trx_id = w.REQUESTING_ENGINE_TRANSACTION_ID
             JOIN information_schema.INNODB_TRX b ON b.trx_id = w.BLOCKING_ENGINE_TRANSACTION_ID`,
                    );
                    diagnostics.lockWaits = lockWaits;
                } catch {
                    try {
                        const [lockWaits] = await pool.query(
                            `SELECT
                 r.trx_id AS waiting_trx_id,
                 r.trx_mysql_thread_id AS waiting_thread,
                 r.trx_query AS waiting_query,
                 b.trx_id AS blocking_trx_id,
                 b.trx_mysql_thread_id AS blocking_thread,
                 b.trx_query AS blocking_query
               FROM information_schema.INNODB_LOCK_WAITS w
               JOIN information_schema.INNODB_TRX r ON r.trx_id = w.requesting_trx_id
               JOIN information_schema.INNODB_TRX b ON b.trx_id = w.blocking_trx_id`,
                        );
                        diagnostics.lockWaits = lockWaits;
                    } catch {
                        diagnostics.lockWaits = [];
                        diagnostics.lockWaitsNote =
                            "Could not query lock waits (requires PROCESS privilege)";
                    }
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
