import EventEmitter from "events";
import { InsertData, SubscriptionParams, Table } from "./Db";
import { QueryError } from "./Errors";
import { Operators, Query } from "./Query";
import * as crypto from 'crypto';
import fs from "fs";

export class RDBRecord extends Map<string, any> {
    events: EventEmitter;
    on: (eventName: string | symbol, listener: (...args: any[]) => void) => EventEmitter;
    off: (eventName: string | symbol, listener: (...args: any[]) => void) => EventEmitter;
    once: (eventName: string | symbol, listener: (...args: any[]) => void) => EventEmitter;
    constructor(data: InsertData, private table: Table) {
        super();
        Object.keys(data).forEach((item) => {
            this.set(item, data[item]);
        });
        this.events = new EventEmitter();
        if(!this.has('createdAt')) this.set('createdAt', Date.now().toString());
        this.set('updatedAt', Date.now().toString());
        this.on = this.events.on;
        this.off = this.events.off;
        this.once = this.events.once;
    }
    get id() {
        return this.get('id');
    }
    /**
     * The date (timestamp) the record was last updated
     */
    get updatedAt() {
        return this.get('updatedAt');
    }
    /**
     * The date (timestamp) the record was created
     */
    get createdAt() {
        return this.get('createdAt');
    }
    /**
     * The sha256 hash of the record
     */
    get hash(){
        const dataString = JSON.stringify(this.toJSON());
        const sha256Hash = crypto.createHash('sha256').update(dataString).digest('hex');
        return sha256Hash;
    }
    /** 
     * Saves the record to the database after updating the data
     */
    save(){
        const file = fs.readFileSync(this.table.filePath, "utf-8");
        const parsed = JSON.parse(file);
        const index = parsed.data.findIndex((item: any) => item.id === this.id);
        if(JSON.stringify(this) == JSON.stringify(parsed.data[index])) return false;
        parsed.data[index] = this.toJSON();
        parsed.data[index].updatedAt = new Date().toISOString();
        fs.writeFileSync(this.table.filePath, JSON.stringify(parsed, null, 2));
        return true;
    }
    /**
     * Removes the record from the database
     */
    async remove() {
        const file = fs.readFileSync(this.table.filePath, "utf-8");
        const parsed = JSON.parse(file);
        const index = parsed.data.findIndex((item: any) => item.id === this.id);
        parsed.data.splice(index, 1);
        fs.writeFileSync(this.table.filePath, JSON.stringify(parsed, null, 2));
        return true;
    }
    /**
     * Subscribes to updates to the record
     */
    async subscribe(fn: (updates: SubscriptionParams) => void) {
        const query = new Query(this.table);
        query.andWhere({
            column: "id",
            op: Operators.EQ,
            value: this.id,
        });
        query.on('removed', fn);
        query.on('updated', fn);
        await this.table.subscribe(query);
        return ()=>{
            query.removeListener('removed', fn);
            query.removeListener('updated', fn);
        }
    }
    /**
     * Updates the record with the new data. Autosaves by default.
     */
    update(column: string, value: any, autosave: boolean = true){
        const col = this.table.columns.find((col) => col.name == column);
        if(!col) throw new QueryError(`Column '${column}' does not exist in table '${this.table.name}'`);
        // if(col.unique && await this.table.find((item) => item.get(column) == value)) throw new QueryError(`Value '${value}' is not unique for column '${column}'`
        if(this.table.validate(value, col)){
            super.set(column, value);
            if( autosave ) this.save();
        } else {
            throw new QueryError(`Value ${value} is not valid for column ${column}`);
        }
    }
    toJSON(){
        return Object.fromEntries(this.entries())
    }
    toString(){
        return JSON.stringify(Object.fromEntries(this.entries()));
    }
}