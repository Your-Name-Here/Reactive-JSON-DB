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
    query:string;
    constructor(message:string, query:string) {
        super(message);
        this.query = query;
    }
}
export class SchemaError extends RDBError {
    schema: any;
    constructor(message:string, schema: any) {
        super(message);
        this.schema = schema;
    }
}
