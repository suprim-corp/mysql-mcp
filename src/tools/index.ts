import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppConfig } from "../config/index.js";
import { registerQuery } from "./query.js";
import { registerMutate } from "./mutate.js";
import { registerAdminExecute } from "./admin-execute.js";
import { registerFindTables } from "./find-tables.js";
import { registerDescribeTables } from "./describe-tables.js";
import { registerDescribeIndexes } from "./describe-indexes.js";
import { registerShowLocks } from "./show-locks.js";
import { registerShowProcesses } from "./show-processes.js";
import { registerAnalyzeIndexUsage } from "./analyze-index-usage.js";
import { registerExplainQuery } from "./explain-query.js";

export function registerAllTools(server: McpServer, config: AppConfig): void {
    const role = config.role;

    // SQL execution — conditional on role
    registerQuery(server, config);

    if (role === "writer" || role === "admin") {
        registerMutate(server, config);
    }

    if (role === "admin") {
        registerAdminExecute(server, config);
    }

    // Diagnostic tools — always available (read-only)
    registerFindTables(server, config);
    registerDescribeTables(server, config);
    registerDescribeIndexes(server, config);
    registerShowLocks(server, config);
    registerShowProcesses(server, config);
    registerAnalyzeIndexUsage(server, config);
    registerExplainQuery(server, config);
}
