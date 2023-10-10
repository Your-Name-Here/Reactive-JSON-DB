/// <reference types="node" />
import EventEmitter from "events";
import { InsertData, SubscriptionParams, Table } from "./Db";
export declare class RDBRecord extends Map<string, any> {
    private table;
    events: EventEmitter;
    on: (eventName: string | symbol, listener: (...args: any[]) => void) => EventEmitter;
    off: (eventName: string | symbol, listener: (...args: any[]) => void) => EventEmitter;
    once: (eventName: string | symbol, listener: (...args: any[]) => void) => EventEmitter;
    constructor(data: InsertData, table: Table);
    get id(): any;
    /**
     * The date (timestamp) the record was last updated
     */
    get updatedAt(): any;
    /**
     * The date (timestamp) the record was created
     */
    get createdAt(): any;
    /**
     * The sha256 hash of the record
     */
    get hash(): string;
    /**
     * Saves the record to the database after updating the data
     */
    save(): boolean;
    /**
     * Removes the record from the database
     */
    remove(): Promise<boolean>;
    /**
     * Subscribes to updates to the record
     */
    subscribe(fn: (updates: SubscriptionParams) => void): Promise<() => void>;
    /**
     * Updates the record with the new data. Autosaves by default.
     */
    update(column: string, value: any, autosave?: boolean): void;
    toJSON(): {
        [k: string]: any;
    };
    toString(): string;
}
