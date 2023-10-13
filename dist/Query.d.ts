/// <reference types="node" />
import { RDBRecord } from "./Record";
import { Table } from "./Db";
import EventEmitter from "events";
export declare enum Operators {
    EQ = "=",
    NE = "!=",
    GT = ">",
    GTE = ">=",
    LT = "<",
    LTE = "<=",
    IN = "in",
    NIN = "nin",
    AND = "and",
    OR = "or",
    NOT = "not",
    REGEX = "regex"
}
export type Rule = {
    column: string;
    op: Operators;
    value: any;
};
type Ruleset = {
    and?: Rule[];
    or?: Rule[];
};
export declare class Query extends EventEmitter {
    private table;
    query: Ruleset;
    private _limit;
    private sortingFn;
    type: 'fetch' | 'insert' | 'update' | 'delete';
    data: RDBRecord[];
    constructor(table: Table);
    /**
     * Returns the results of the query as an array of RDBRecords
     *
     * If no where clauses are added, returns all records in the table.
     */
    find(): RDBRecord[];
    /**
     * Adds a where clause to the query. Can be chained. eg. `query.where({ column: "id", op: Operators.EQ, value: 1 }).execute()`
     *
     * This is an alias for `query.orWhere()` so you can actually call this several times on a query to add multiple "or where" clauses.
     */
    where(rule: Rule): this;
    /**
     * Adds an "and where" clause to the query. Can be chained. eg.
     *
     * `query.andWhere({ column: "name", op: Operators.EQ, value: 'John' }).andWhere({ value: 'gmail.com', op: Operators.IN, column: 'email' }).execute()`
     */
    andWhere(rule: Rule): this;
    /**
     * Adds an "or where" clause to the query. Can be chained and called multiple times on the same query.
     */
    orWhere(rule: Rule): this;
    /**
     * Transforms into an `Update` query and sets data to be updated. Need to call execute() to run the query after adding where clauses.
     * Can be chained. eg. `query.update([{ name: "John Doe" }]).where({ column: "id", op: Operators.EQ, value: 1 }).execute()`
     */
    set(columns: {
        name: string;
        value: any;
    }[]): this;
    /**
     * Transforms this query into an insert query. Need to call execute() to run the query after adding where clauses.
     * Can be chained. eg. `query.insert({ name: "John Doe" }).execute()`
     */
    insert(data: InsertQuery | RDBRecord): this;
    /**
     * Transforms this query into a delete query. Need to call execute() to run the query after adding where clauses.
     * Can be chained. eg. `query.delete().where({ column: "id", op: Operators.EQ, value: 1 }).execute()`
     */
    delete(): this;
    /**
     * Limit the operation to a certain number of records.
     */
    limit(limit: number): this;
    /**
     * Subscribes to the query and returns an unsubscribe function
     * @param fn function to run when the data is changed
     * @returns promise - an unsubscribe function
     * @todo implement unsubscribe
     */
    subscribe(): Promise<void>;
    orderBy(column: string, direction: 'ASC' | 'DESC'): this;
    private satisfiesRule;
    private satisfiesRuleset;
    /**
     * Executes the query and returns the result.
     * @todo implement update and delete queries
     */
    execute(): Promise<RDBRecord[]>;
}
export type InsertQuery = Record<string, any>;
export {};
