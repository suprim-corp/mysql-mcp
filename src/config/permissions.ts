export type Role = "readonly" | "writer" | "admin";

export enum SqlOperation {
    SELECT = "SELECT",
    SHOW = "SHOW",
    DESCRIBE = "DESCRIBE",
    EXPLAIN = "EXPLAIN",
    INSERT = "INSERT",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    CREATE = "CREATE",
    ALTER = "ALTER",
    DROP = "DROP",
    TRUNCATE = "TRUNCATE",
}

const ROLE_PERMISSIONS: Record<Role, Set<SqlOperation>> = {
    readonly: new Set([
        SqlOperation.SELECT,
        SqlOperation.SHOW,
        SqlOperation.DESCRIBE,
        SqlOperation.EXPLAIN,
    ]),
    writer: new Set([
        SqlOperation.SELECT,
        SqlOperation.SHOW,
        SqlOperation.DESCRIBE,
        SqlOperation.EXPLAIN,
        SqlOperation.INSERT,
        SqlOperation.UPDATE,
        SqlOperation.DELETE,
    ]),
    admin: new Set([
        SqlOperation.SELECT,
        SqlOperation.SHOW,
        SqlOperation.DESCRIBE,
        SqlOperation.EXPLAIN,
        SqlOperation.INSERT,
        SqlOperation.UPDATE,
        SqlOperation.DELETE,
        SqlOperation.CREATE,
        SqlOperation.ALTER,
        SqlOperation.DROP,
        SqlOperation.TRUNCATE,
    ]),
};

const SQL_COMMENT_PATTERN = /--.*$|\/\*[\s\S]*?\*\//gm;

export function extractOperations(sql: string): Set<SqlOperation> {
    const cleaned = sql.replace(SQL_COMMENT_PATTERN, "").toUpperCase();
    const ops = new Set<SqlOperation>();
    for (const op of Object.values(SqlOperation)) {
        if (new RegExp(`\\b${op}\\b`).test(cleaned)) {
            ops.add(op);
        }
    }
    return ops;
}

export function checkPermissions(sql: string, role: Role): void {
    const requested = extractOperations(sql);
    const allowed = ROLE_PERMISSIONS[role];
    const unauthorized = [...requested].filter((op) => !allowed.has(op));
    if (unauthorized.length > 0) {
        throw new Error(
            `Permission denied: role "${role}" cannot execute: ${unauthorized.join(", ")}`,
        );
    }
}

export function validateAllowedOps(
    sql: string,
    allowed: Set<SqlOperation>,
): void {
    const found = extractOperations(sql);
    const unauthorized = [...found].filter((op) => !allowed.has(op));
    if (unauthorized.length > 0) {
        throw new Error(
            `This tool only supports: ${[...allowed].join(", ")}. Found unauthorized: ${unauthorized.join(", ")}`,
        );
    }
}
