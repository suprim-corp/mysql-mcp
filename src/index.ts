import { Command } from "commander";
import { config as dotenvConfig } from "dotenv";
import { loadConfig } from "./config/index.js";
import { startStdio, startHttp } from "./server.js";

const program = new Command();

program
    .name("mysql-mcp")
    .description("MySQL MCP server for AI assistants")
    .version("0.1.0")
    .option("--transport <type>", "Transport mode: stdio or http", "stdio")
    .option("--port <number>", "HTTP port (for http transport)", "3000")
    .option("--host <string>", "MySQL host")
    .option("--port-db <number>", "MySQL port")
    .option("--user <string>", "MySQL user")
    .option("--password <string>", "MySQL password")
    .option("--database <string>", "MySQL database")
    .option("--role <string>", "Permission role: readonly, writer, admin")
    .option("--env-file <path>", "Path to .env file");

program.parse();

const opts = program.opts();

dotenvConfig({ path: opts.envFile });

const appConfig = loadConfig(opts);

if (opts.transport === "http") {
    startHttp(appConfig);
} else {
    startStdio(appConfig);
}
