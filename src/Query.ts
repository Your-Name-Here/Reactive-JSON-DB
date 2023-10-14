import { QueryError } from "./Errors";
import { RDBRecord } from "./Record";
import { Table } from "./Db";
import EventEmitter from "events";

export enum Operators {
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
    REGEX = "regex",
}
export type Rule = {
    column: string,
    op: Operators,
    value: any
}
type Ruleset = { and?: Rule[], or?: Rule[] }
export class Query extends EventEmitter {
    query: Ruleset = { };
    private _limit: number|null = null;
    private sortingFn: (a: RDBRecord, b: RDBRecord) => number = (a, b) => 0;
    type: 'fetch'|'insert'|'update'|'delete' = 'fetch';
    data: RDBRecord[]=[];

    constructor(private table: Table) {
        super()
        this.table = table;
    }
    /**
     * Returns the results of the query as an array of RDBRecords
     *
     * If no where clauses are added, returns all records in the table.
     */
    public find(): RDBRecord[] {
        if(this.query.and == undefined && this.query.or === undefined) return this.table.data.sort(this.sortingFn).slice(0, this._limit||undefined);
        const raw = this.table.data.filter((item) => this.satisfiesRuleset(item, this.query));
        if(this._limit) {
            return raw.sort(this.sortingFn).slice(0, this._limit);
        }
        return raw.sort(this.sortingFn);
    }
    /**
     * Adds a where clause to the query. Can be chained. eg. `query.where({ column: "id", op: Operators.EQ, value: 1 }).execute()`
     *
     * This is an alias for `query.orWhere()` so you can actually call this several times on a query to add multiple "or where" clauses.
     */
    where(rule:Rule) {
        this.orWhere(rule);
        return this;
    }
    /**
     * Adds an "and where" clause to the query. Can be chained. eg.
     *
     * `query.andWhere({ column: "name", op: Operators.EQ, value: 'John' }).andWhere({ value: 'gmail.com', op: Operators.IN, column: 'email' }).execute()`
     */
    public andWhere(rule: Rule){
        if(this.query.and == undefined) this.query.and = [rule];
        else this.query.and.push( rule );
        return this;
    }
    /**
     * Adds an "or where" clause to the query. Can be chained and called multiple times on the same query.
     */
    public orWhere(rule: Rule){
        if(this.query.or == undefined) this.query.or = [rule];
        else this.query.or.push( rule );
        return this;
    }
    /**
     * Transforms into an `Update` query and sets data to be updated. Need to call execute() to run the query after adding where clauses.
     * Can be chained. eg. `query.update([{ name: "John Doe" }]).where({ column: "id", op: Operators.EQ, value: 1 }).execute()`
     */
    public set(columns: { name:string, value:any }[]) {
        this.type = 'update';
        for(const record of this.data){
            for(const column of columns){
                record.set(column.name, column.value);
            }
        }
        return this;
    }
    /**
     * Transforms this query into an insert query. Need to call execute() to run the query after adding where clauses.
     * Can be chained. eg. `query.insert({ name: "John Doe" }).execute()`
     */
    public insert(data: InsertQuery|RDBRecord){
        this.type = 'insert';
        if(data instanceof RDBRecord) this.data.push(data);
        else this.data.push( new RDBRecord(data, this.table) );
        return this;
    }
    /**
     * Transforms this query into a delete query. Need to call execute() to run the query after adding where clauses.
     * Can be chained. eg. `query.delete().where({ column: "id", op: Operators.EQ, value: 1 }).execute()`
     */
    public delete() {
        this.type = 'delete';
        return this;
    }
    public count() {
        return this.find().length;
    }
    /**
     * Limit the operation to a certain number of records.
     */
    public limit(limit: number) {
        this._limit = limit;
        return this;
    }
    /**
     * Subscribes to the query and returns an unsubscribe function
     * @param fn function to run when the data is changed
     * @returns promise - an unsubscribe function
     * @todo implement unsubscribe
     */
    public async subscribe() {
        // throw new QueryError("Not Implemented");
        if(this.type != 'fetch') throw new QueryError(`Only fetch queries can be subscribed to. This query type: '${ this.type }'.`, this.toString());
        this.table.subscribe(this);
    }
    public orderBy(column: string, direction: 'ASC'|'DESC') {
        if(direction == 'ASC') this.sortingFn = (a, b) => a.get(column) - b.get(column);
        else this.sortingFn = (a, b) => b.get(column) - a.get(column);
        return this;
    }
    private satisfiesRule(item: RDBRecord, rule: Rule): boolean {
        switch (rule.op) {
        case Operators.EQ:
            return item.get(rule.column) === rule.value;
            break;
        case Operators.NE:
            return item.get(rule.column) !== rule.value;
            break;
        case Operators.GT:
            return item.get(rule.column) > rule.value;
            break;
        case Operators.GTE:
            return item.get(rule.column) >= rule.value;
            break;
        case Operators.LT:
            return item.get(rule.column) < rule.value;
            break;
        case Operators.LTE:
            return item.get(rule.column) <= rule.value;
            break;
        case Operators.IN:
            return item.get(rule.column).toLowerCase().includes(rule.value.toLowerCase());
            break;
        // Handle other operators as needed.
        default:
            return false;
        }
    }
    private satisfiesRuleset(item: RDBRecord, ruleset: Ruleset): boolean {
        let satisfiesAnd = true;
        let satisfiesOr = true;
        if('and' in ruleset){
            satisfiesAnd = (ruleset.and ?? []).every((rule) => this.satisfiesRule(item, rule));
        }
        if('or' in ruleset){
            satisfiesOr = (ruleset.or ?? []).some((rule) => this.satisfiesRule(item, rule));
        }
        return satisfiesAnd && satisfiesOr;
    };
    /**
     * Executes the query and returns the result.
     * @todo implement update and delete queries
     */
    public async execute(){
        if(this.type == 'fetch') return this.find();
        if(this.type == 'insert') {
            if(this.data) return [await this.table.insert(this.data)];
            else throw new QueryError("No data to insert", this.toString());
            const ret:RDBRecord[] = [];
            if(this.data.length) {
                for(const record of this.data){
                    await this.table.insert(record)
                    ret.push(record);
                }
                return ret;
            } else throw new QueryError("No data to insert");
        }
        if(this.type == 'update') {
            const records = this.table.data.filter((item) => this.satisfiesRuleset(item, this.query));
            if(records) {
                const max = this._limit || records.length;
                for(var i = 1; i < max; i++) {
                    for(const d of this.data){
                        records[i].set(d.name, d.value);
                    }
                    records[i].save();
                }
            }
        }
        if(this.type == 'delete') {
            const ret = []
            const max = this._limit || this.table.data.length;
            for(var i = 0; i < max; i++) {
                let record = this.table.data[i]
                record.remove();
                ret.push(record);
            }
            return ret;
        }
        return [];
    }
    toString() {
        return `${ this.type } query on table ${ this.table.name } with ruleset ${ JSON.stringify(this.query) }`
    }
}
export type InsertQuery = Record<string, any>