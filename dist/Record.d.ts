import { InsertData, SubscriptionParams, Table } from "./Db";
export declare class RDBRecord extends Map<string, any> {
    private table;
    constructor(data: InsertData, table: Table);
    get id(): any;
    get hash(): string;
    save(): boolean;
    remove(): Promise<boolean>;
    subscribe(fn: (updates: SubscriptionParams) => void): Promise<void>;
    update(column: string, value: any, autosave?: boolean): void;
    toJSON(): {
        [k: string]: any;
    };
    toString(): string;
}
