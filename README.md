# mysql-mcp

A MySQL MCP (Model Context Protocol) server for AI assistants. Execute queries, inspect schemas, diagnose locks, and
analyze performance — all through a standard MCP interface.

## Features

- **8 MCP tools** for database interaction and diagnostics
- **Role-based permissions** (readonly, writer, admin)
- **Secure** — parameterized queries, no SQL injection
- **Zero config** — works with environment variables
- **npx-ready** — run directly without installing

## Quick Start

```bash
npx @suprim/mysql-mcp --host localhost --user root --password secret --database mydb
```

Or with environment variables:

```bash
export MYSQL_HOST=localhost
export MYSQL_USER=root
export MYSQL_PASSWORD=secret
export MYSQL_DATABASE=mydb
npx @suprim/mysql-mcp
```

## Claude Code

```bash
claude mcp add mysql-mcp -- npx -y @suprim/mysql-mcp --env-file .env
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
	"mcpServers": {
		"mysql": {
			"command": "npx",
			"args": [
				"@suprim/mysql-mcp"
			],
			"env": {
				"MYSQL_HOST": "localhost",
				"MYSQL_USER": "root",
				"MYSQL_PASSWORD": "secret",
				"MYSQL_DATABASE": "myapp",
				"MYSQL_ROLE": "readonly"
			}
		}
	}
}
```

## Tools

### SQL Execution (role-gated)

| Tool             | Role Required | Description                                                       |
|------------------|---------------|-------------------------------------------------------------------|
| `query`          | all           | Read-only SQL (SELECT, SHOW, DESCRIBE, EXPLAIN). Default 1000 row limit. |
| `mutate`         | writer+       | Data modifications (INSERT, UPDATE, DELETE). Transaction-wrapped. Supports dry_run. |
| `admin_execute`  | admin         | DDL statements (CREATE, ALTER, DROP, TRUNCATE). Supports dry_run. |

Tools are conditionally registered — if your role is `readonly`, `mutate` and `admin_execute` won't appear.

### Diagnostics (always available)

| Tool                  | Description                                                |
|-----------------------|------------------------------------------------------------|
| `find_tables`         | Search tables by comment/description keyword               |
| `describe_tables`     | Get column structure for tables                            |
| `describe_indexes`    | Get index information for tables                           |
| `show_locks`          | Diagnose current table and row-level locks                 |
| `show_processes`      | Database health snapshot (processes, InnoDB, transactions)  |
| `analyze_index_usage` | Find redundant, unused, and slow indexes                   |
| `explain_query`       | Analyze a query with EXPLAIN plan and table metadata       |

## CLI Options

```
--transport <type>    Transport mode: stdio or http (default: stdio)
--port <number>       HTTP port for http transport (default: 3000)
--host <string>       MySQL host (default: localhost)
--port-db <number>    MySQL port (default: 3306)
--user <string>       MySQL user (default: root)
--password <string>   MySQL password
--database <string>   MySQL database
--role <string>       Permission role: readonly, writer, admin (default: readonly)
--env-file <path>     Path to .env file
```

## Environment Variables

| Variable            | Default     | Description                  |
|---------------------|-------------|------------------------------|
| `MYSQL_HOST`        | `localhost` | MySQL server host            |
| `MYSQL_PORT`        | `3306`      | MySQL server port            |
| `MYSQL_USER`        | `root`      | MySQL username               |
| `MYSQL_PASSWORD`    |             | MySQL password               |
| `MYSQL_DATABASE`    |             | Default database             |
| `MYSQL_ROLE`        | `readonly`  | Permission role              |
| `POOL_SIZE`         | `10`        | Connection pool size         |
| `POOL_IDLE_TIMEOUT` | `60000`     | Idle connection timeout (ms) |
| `HTTP_PORT`         | `3000`      | HTTP transport port          |

## Permission Roles

- **readonly** — SELECT, SHOW, DESCRIBE, EXPLAIN
- **writer** — readonly + INSERT, UPDATE, DELETE
- **admin** — writer + CREATE, ALTER, DROP, TRUNCATE

## Development

```bash
bun install
bun run build
bun run dev -- --database mydb --user root --password secret
```

## License

MIT
