class RDBError extends Error {
    message: string;
    constructor(message:string) {
        super(message);
        this.message = message;
    }
}
export class DatabaseError extends RDBError {
    constructor(message:string) {
        super(message);
    }
}
export class QueryError extends RDBError {
    constructor(message:string) {
        super(message);
    }
}
export class SchemaError extends RDBError {
    constructor(message:string) {
        super(message);
    }
}
