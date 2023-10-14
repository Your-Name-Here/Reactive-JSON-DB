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
    data: any;

    constructor(private table: Table) {
        super()
        this.table = table;
    }
    public find(): RDBRecord[] {
        const raw = this.table.data.filter((item) => this.satisfiesRuleset(item, this.query));
        if(this._limit) {
            return raw.sort(this.sortingFn).slice(0, this._limit);
        }
        return raw.sort(this.sortingFn);
    }
    where(rule:Rule) {
        this.orWhere(rule);
        return this;
    }
    public andWhere(rule: Rule){
        if(this.query.and == undefined) this.query.and = [rule];
        else this.query.and.push( rule );
        return this;
    }
    public orWhere(rule: Rule){
        if(this.query.or == undefined) this.query.or = [rule];
        else this.query.or.push( rule );
        return this;
    }
    public set(columns: { name:string, value:any }[]) {
        this.type = 'update';
        return this;
    }
    public insert(data: InsertQuery){
        this.type = 'insert';
        this.data = data;
        return this;
    }
    public delete() {
        this.type = 'delete';
        return this;
    }
    public count() {
        return this.find().length;
    }
    public limit(limit: number) {
        this._limit = limit;
        return this;
    }
    /**
     * Subscribes to the query and returns an unsubscribe function
     * @param fn function to run when the data is changed
     * @returns promise - an unsubscribe function
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
    public async execute(){
        // throw new QueryError("Not Implemented");
        if(this.type == 'fetch') return this.find();
        if(this.type == 'insert') {
            if(this.data) return [await this.table.insert(this.data)];
            else throw new QueryError("No data to insert", this.toString());
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