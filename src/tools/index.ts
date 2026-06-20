import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppConfig } from "../config/index.js";
import { registerExecuteSql } from "./execute-sql.js";
import { registerGetTableDesc } from "./get-table-desc.js";
import { registerGetTableIndex } from "./get-table-index.js";
import { registerGetTableName } from "./get-table-name.js";
import { registerGetTableLock } from "./get-table-lock.js";
import { registerGetDbHealthRunning } from "./get-db-health-running.js";
import { registerGetDbHealthIndexUsage } from "./get-db-health-index-usage.js";
import { registerOptimizeSql } from "./optimize-sql.js";

export function registerAllTools(server: McpServer, config: AppConfig): void {
    registerExecuteSql(server, config);
    registerGetTableDesc(server, config);
    registerGetTableIndex(server, config);
    registerGetTableName(server, config);
    registerGetTableLock(server, config);
    registerGetDbHealthRunning(server, config);
    registerGetDbHealthIndexUsage(server, config);
    registerOptimizeSql(server, config);
}
