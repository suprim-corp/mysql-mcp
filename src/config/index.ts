import type { Role } from "./permissions.js";

export interface DbConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    connectionLimit: number;
    idleTimeout: number;
}

export interface AppConfig {
    db: DbConfig;
    role: Role;
    transport: "stdio" | "http";
    httpPort: number;
}

export function loadConfig(
    cliOpts: Record<string, string | undefined>,
): AppConfig {
    return {
        db: {
            host: cliOpts.host ?? process.env.MYSQL_HOST ?? "localhost",
            port: Number(cliOpts.portDb ?? process.env.MYSQL_PORT ?? 3306),
            user: cliOpts.user ?? process.env.MYSQL_USER ?? "root",
            password: cliOpts.password ?? process.env.MYSQL_PASSWORD ?? "",
            database: cliOpts.database ?? process.env.MYSQL_DATABASE ?? "",
            connectionLimit: Number(process.env.POOL_SIZE ?? 10),
            idleTimeout: Number(process.env.POOL_IDLE_TIMEOUT ?? 60000),
        },
        role: (cliOpts.role ?? process.env.MYSQL_ROLE ?? "readonly") as Role,
        transport: (cliOpts.transport ?? "stdio") as "stdio" | "http",
        httpPort: Number(cliOpts.port ?? process.env.HTTP_PORT ?? 3000),
    };
}
