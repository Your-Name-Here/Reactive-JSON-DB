import { SubscriptionParams, Table } from "./Db";
import { FetchQuery, Operators } from "./Query";
import fs from "fs";

export class RDBRecord extends Map<string, any> {
    constructor(data: object, private table: Table) {
        super();
        Object.keys(data).forEach((item) => {
            this.set(item, data[item]);
        });
    }
    get id() {
        return this.get('id');
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
        const query = new FetchQuery({
            column: "id",
            op: Operators.EQ,
            value: this.id,
        });
        return await this.table.subscribe(query, fn);
    }
    toJSON(){
        return Object.fromEntries(this.entries())
    }
    toString(){
        return JSON.stringify(Object.fromEntries(this.entries()));
    }
}