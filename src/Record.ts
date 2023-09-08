import { Column, InsertData, SubscriptionParams, Table } from "./Db";
import { QueryError } from "./Errors";
import { Operators, Query } from "./Query";
import * as crypto from 'crypto';
import fs from "fs";

export class RDBRecord extends Map<string, any> {
    constructor(data: InsertData, private table: Table) {
        super();
        Object.keys(data).forEach((item) => {
            this.set(item, data[item]);
        });
    }
    get id() {
        return this.get('id');
    }
    get hash(){
        const dataString = JSON.stringify(this.toJSON());
        const sha256Hash = crypto.createHash('sha256').update(dataString).digest('hex');
        return sha256Hash;
    }
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
    async remove() {
        const file = fs.readFileSync(this.table.filePath, "utf-8");
        const parsed = JSON.parse(file);
        const index = parsed.data.findIndex((item: any) => item.id === this.id);
        parsed.data.splice(index, 1);
        fs.writeFileSync(this.table.filePath, JSON.stringify(parsed, null, 2));
        return true;
    }
    async subscribe(fn: (updates: SubscriptionParams) => void) {
        const query = new Query(this.table);
        query.andWhere({
            column: "id",
            op: Operators.EQ,
            value: this.id,
        });
        query.on('removed', fn);
        return await this.table.subscribe(query);
    }
    // I would like to add a way to set the value of a column and then have it automatically save to the database but I'm not sure how to do that because the set method is already taken
    update(column: string, value: any, autosave: boolean = true){
        const col = this.table.columns.find((col) => col.name == column);
        if(!col) throw new QueryError(`Column '${column}' does not exist in table '${this.table.name}'`);
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