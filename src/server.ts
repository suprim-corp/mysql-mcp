import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./tools/index.js";
import { initPool, closePool } from "./db/pool.js";
import type { AppConfig } from "./config/index.js";

export async function createServer(config: AppConfig): Promise<McpServer> {
    const server = new McpServer({
        name: "mysql-mcp",
        version: "0.1.0",
    });

    initPool(config.db);
    registerAllTools(server, config);

    return server;
}

export async function startStdio(config: AppConfig): Promise<void> {
    const server = await createServer(config);
    const transport = new StdioServerTransport();
    await server.connect(transport);

    const shutdown = async () => {
        await closePool();
        process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}

export async function startHttp(config: AppConfig): Promise<void> {
    // Phase 3: Streamable HTTP transport
    console.error(`HTTP transport not yet implemented. Use --transport stdio.`);
    process.exit(1);
}
