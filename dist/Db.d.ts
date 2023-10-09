import { Mutex } from "./Utils";
import { InsertQuery, Query } from "./Query";
import { RDBRecord } from "./Record";
import { ValidationType } from "./Validations";
export type SubscriptionParams = {
    added: any[];
    removed: any[];
    updated: any[];
};
export type TableSchema = {
    name: string;
    columns: Column[];
};
type DatabaseOptions = {
    schemas?: TableSchema[];
    directory?: string;
};
export type Column = {
    name: string;
    autoIncrement?: boolean;
    type: ValidationType;
    enum?: Array<string | number | boolean>;
    default?: any;
    required?: boolean;
    format?: string;
    unique?: boolean;
    nullable?: boolean;
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
};
export type InsertData = {
    [key: string]: any;
};
export declare class Table {
    private readonly schema;
    private filepath;
    private _mutex;
    columns: Column[];
    name: string;
    private dropped;
    subscriptions: {
        current: RDBRecord[];
        query: Query;
    }[];
    constructor(schema: TableSchema, filepath: string);
    insert(data: InsertData): Promise<RDBRecord>;
    /**
     * Removes a record from the table
     * @param query
     * @returns {number} - the number of rows affected
     */
    remove(query: RDBRecord): Promise<number>;
    update(query: Query, data: InsertQuery): Promise<number>;
    find(query: Query): Promise<RDBRecord[]>;
    get data(): RDBRecord[];
    validate(data: any, against: Column): boolean;
    get filePath(): string;
    get columnNames(): string[];
    get size(): number;
    private getInsertID;
    private incrementInsertID;
    findOne(query: Query): Promise<RDBRecord>;
    /**
     * Deletes records from the table
     * @param query the query to find which records to delete
     * @returns a function that will revert the changes when called
     */
    delete(query: Query): Promise<() => void>;
    /**
     * Drops the table and deletes the file
     */
    drop(): void;
    subscribe(query: Query): Promise<void>;
}
export declare class RDatabase {
    /**
     * A mutex to prevent multiple threads from accessing the database at the same time
     * This should not be accessed directly
     */
    mutex: Mutex;
    directory: string;
    tables: Map<string, Table>;
    constructor(options: DatabaseOptions);
    /**
     * Creates a table
     */
    create(schemas: TableSchema[]): Map<string, Table>;
    /**
     * Drops a table (delete table file)
     */
    drop(table: string): void;
}
export {};
