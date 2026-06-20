import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppConfig } from "../config/index.js";
import { getPool } from "../db/pool.js";

export function registerGetDbHealthRunning(
    server: McpServer,
    _config: AppConfig,
): void {
    server.tool(
        "get_db_health_running",
        "Get a database health snapshot: active processes, InnoDB status, running transactions, and connection limits.",
        {},
        async () => {
            try {
                const pool = getPool();
                const diagnostics: Record<string, unknown> = {};

                const [processList] = await pool.query(`SHOW FULL PROCESSLIST`);
                diagnostics.processList = processList;

                try {
                    const [status] = await pool.query(
                        `SHOW ENGINE INNODB STATUS`,
                    );
                    diagnostics.innodbStatus = status;
                } catch {
                    diagnostics.innodbStatus = "Requires PROCESS privilege";
                }

                try {
                    const [trx] = await pool.query(
                        `SELECT trx_id, trx_state, trx_started, trx_wait_started,
                    trx_mysql_thread_id, trx_query, trx_operation_state,
                    trx_rows_locked, trx_rows_modified
             FROM information_schema.INNODB_TRX
             ORDER BY trx_started`,
                    );
                    diagnostics.activeTransactions = trx;
                } catch {
                    diagnostics.activeTransactions =
                        "Could not query INNODB_TRX";
                }

                const [variables] = await pool.query(
                    `SHOW GLOBAL VARIABLES WHERE Variable_name IN ('max_connections', 'wait_timeout', 'interactive_timeout')`,
                );
                diagnostics.connectionSettings = variables;

                const [statusVars] = await pool.query(
                    `SHOW GLOBAL STATUS WHERE Variable_name IN ('Threads_connected', 'Threads_running', 'Connections')`,
                );
                diagnostics.connectionStatus = statusVars;

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
