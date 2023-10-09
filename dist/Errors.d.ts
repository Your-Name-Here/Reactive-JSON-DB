declare class RDBError extends Error {
    message: string;
    constructor(message: string);
}
export declare class DatabaseError extends RDBError {
    constructor(message: string);
}
export declare class QueryError extends RDBError {
    constructor(message: string);
}
export declare class SchemaError extends RDBError {
    constructor(message: string);
}
export {};
