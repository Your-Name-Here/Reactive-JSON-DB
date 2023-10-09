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
    data: any;
    constructor(table: Table);
    find(): RDBRecord[];
    where(rule: Rule): this;
    andWhere(rule: Rule): this;
    orWhere(rule: Rule): this;
    set(columns: {
        name: string;
        value: any;
    }[]): this;
    insert(data: InsertQuery): this;
    delete(): void;
    limit(limit: number): this;
    /**
     * Subscribes to the query and returns an unsubscribe function
     * @param fn function to run when the data is changed
     * @returns promise - an unsubscribe function
     */
    subscribe(): Promise<void>;
    orderBy(column: string, direction: 'ASC' | 'DESC'): this;
    private satisfiesRule;
    private satisfiesRuleset;
    execute(): Promise<RDBRecord | RDBRecord[]>;
}
export type InsertQuery = Record<string, any>;
export {};
