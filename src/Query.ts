import def from "ajv/dist/vocabularies/discriminator";
import { Observable } from "./Utils";
import { Schema } from "ajv";
import { QueryError } from "./Errors";
import { RDBRecord } from "./Record";
import { SubscriptionParams, Table } from "./Db";

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

interface QueryObjectWithConditions {
    and: QueryObjectWithKey[];
    or: QueryObjectWithKey[];
  }
  
  export interface QueryObjectWithAndConditions {
    and: QueryObjectWithKey[];
  }
  
  export interface QueryObjectWithOrConditions {
    or: QueryObjectWithKey[];
  }
  
  export interface QueryObjectWithKey {
    column: any;
    value: any;
    op: Operators;
  }
  export type QueryForInsert  = Record<string, any>
  export type QueryObject =
    | QueryObjectWithKey
    | QueryObjectWithConditions
    | QueryObjectWithAndConditions
    | QueryObjectWithOrConditions;  

export class FetchQuery {
    schema: Schema;
    constructor(private _query: QueryObject) {
        if(!this.query) throw new QueryError("Query must be defined");
        if(Array.isArray(this.query)) throw new QueryError("Query must be an object; Array given");
        if(typeof this.query !== "object") throw new QueryError("Query must be an object: "+typeof this.query)+" given";  
    }
    // get the columns that are being affected by the query
    affectingColumns(): string[] {
        if ( 'column' in this._query ) return [this._query.column];
        if ( 'and' in this._query ) return [...this._query.and.map(item=>item.column) ]
        if ( 'or' in this._query ) return [...this._query.or.map(item=>item.column) ]
        return []
    }
    filteringFunctions(): ((item: RDBRecord) => boolean)[] {
        const functions = [];
        if ( 'column' in this._query ) {
            const { column, value, op } = this._query as QueryObjectWithKey;
            switch (op) {
            case Operators.EQ:
                functions.push((item:RDBRecord) => item.get(column) === value);
                break;
            case Operators.NE:
                functions.push((item:RDBRecord) => item.get(column) !== value);
                break;
            case Operators.GT:
                functions.push((item:RDBRecord) => item.get(column) > value);
                break;
            case Operators.GTE:
                functions.push((item:RDBRecord) => item.get(column) >= value);
                break;
            case Operators.LT:
                functions.push((item:RDBRecord) => item.get(column) < value);
                break;
            case Operators.LTE:
                functions.push((item:RDBRecord) => item.get(column) <= value);
                break;
            case Operators.IN:
                functions.push((item:RDBRecord) => item.get(column).toLowerCase().includes(value.toLowerCase()));
                break;
            // Handle other operators as needed.
            default:
                break;
            }
        } else if( 'and' in this.query ) {
            for( const subQuery of this.query.and) {
                switch (subQuery.op) {
                    case Operators.EQ:
                        functions.push((item:RDBRecord) => item.get(subQuery.column) == subQuery.value);
                        break;
                    case Operators.NE:
                        functions.push((item:RDBRecord) => item.get(subQuery.column) != subQuery.value);
                        break;
                    case Operators.GT:
                        functions.push((item:RDBRecord) => item.get(subQuery.column) > subQuery.value);
                        break;
                    case Operators.GTE:
                        functions.push((item:RDBRecord) => item.get(subQuery.column) >= subQuery.value);
                        break;
                    case Operators.LT:
                        functions.push((item:RDBRecord) => item.get(subQuery.column) < subQuery.value);
                        break;
                    case Operators.LTE:
                        functions.push((item:RDBRecord) => item.get(subQuery.column) <= subQuery.value);
                        break;
                    case Operators.IN:
                        functions.push((item:RDBRecord) => subQuery.value.includes(item.get(subQuery.column)));
                        break;
                    case Operators.NIN:
                        functions.push((item:RDBRecord) => !subQuery.value.includes(item.get(subQuery.column)));
                        break;
                    case Operators.REGEX:
                        functions.push((item:RDBRecord) => new RegExp(subQuery.value).test(item.get(subQuery.column)));
                        break;
                    default:
                        break;
                }
            }
        } else if ( 'or' in this.query ) {
            for( const subQuery of this.query.or) {
                switch (subQuery.op) {
                    case Operators.EQ:
                        functions.push((item:RDBRecord) => item.get(subQuery.column) == subQuery.value);
                        break;
                    case Operators.NE:
                        functions.push((item:RDBRecord) => item.get(subQuery.column) != subQuery.value);
                        break;
                    case Operators.GT:
                        functions.push((item:RDBRecord) => item.get(subQuery.column) > subQuery.value);
                        break;
                    case Operators.GTE:
                        functions.push((item:RDBRecord) => item.get(subQuery.column) >= subQuery.value);
                        break;
                    case Operators.LT:
                        functions.push((item:RDBRecord) => item.get(subQuery.column) < subQuery.value);
                        break;
                    case Operators.LTE:
                        functions.push((item:RDBRecord) => item.get(subQuery.column) <= subQuery.value);
                        break;
                    case Operators.IN:
                        functions.push((item:RDBRecord) => subQuery.value.includes(item.get(subQuery.column)));
                        break;
                    case Operators.NIN:
                        functions.push((item:RDBRecord) => !subQuery.value.includes(item.get(subQuery.column)));
                        break;
                    case Operators.REGEX:
                        functions.push((item:RDBRecord) => new RegExp(subQuery.value).test(item.get(subQuery.column)));
                        break;
                    default:
                        break;
                }
            }
        } else {
            throw new QueryError("Invalid query object");
        }
        return functions;
    }
    filter(data: any[], query?: QueryObject | QueryObject[]): any[] {
        if (Array.isArray(this.query)) {
          // If query is an array of QueryObjects, apply each query individually and merge the results.
          return this.query.reduce((result, subQuery) => [...result, ...this.filter(data, subQuery)], []);
        }
        
        if ('column' in this.query) {
            // If it's a QueryObjectWithKey, apply the filter based on key, value, and operator.
            const { column, value, op } = this.query as QueryObjectWithKey;
            return data.filter((item) => {
                switch (op) {
                case Operators.EQ:
                    return item[column] === value;
                case Operators.NE:
                    return item[column] !== value;
                case Operators.GT:
                    return item[column] > value;
                case Operators.GTE:
                    debugger
                    return item[column] >= value;
                case Operators.LT:
                    return item[column] < value;
                case Operators.LTE:
                    return item[column] <= value;
                // Handle other operators as needed.
                default:
                    return false;
                }
            });
        } else if ('and' in this.query && 'or' in this.query) {
            // If it's a QueryObjectWithConditions, recursively apply AND and OR conditions.
            const andResults = this.filter(data, this.query.and);
            const orResults = this.filter(data, this.query.or);
            return andResults.filter((item) => orResults.includes(item));
        } else if ('and' in this.query) {
            const methods = [];
            // check the schema to ensure that the column exists

            for( const subQuery of this.query.and) {
                switch (subQuery.op) {
                    case Operators.EQ:
                        methods.push((item) => {
                            debugger
                            return item[subQuery.column] == subQuery.value
                        });
                        break;
                    case Operators.NE:
                        methods.push((item) => item[subQuery.column] != subQuery.value);
                        break;
                    case Operators.GT:
                        methods.push((item) => item[subQuery.column] > subQuery.value);
                        break;
                    case Operators.GTE:
                        methods.push((item) => {
                            debugger
                            return item[subQuery.column] >= subQuery.value
                        });
                        break;
                    case Operators.LT:
                        methods.push((item) => item[subQuery.column] < subQuery.value);
                        break;
                    case Operators.LTE:
                        methods.push((item) => item[subQuery.column] <= subQuery.value);
                        break;
                    case Operators.IN:
                        methods.push((item) => subQuery.value.includes(item[subQuery.column]));
                        break;
                    case Operators.NIN:
                        methods.push((item) => !subQuery.value.includes(item[subQuery.column]));
                        break;
                    case Operators.REGEX:
                        methods.push((item) => new RegExp(subQuery.value).test(item[subQuery.column]));
                        break;
                    default:
                        break;
                }

            }
            debugger
            data = data.filter((item) => methods.every((method) => method(item)));
            return data;
            // If it's a QueryObjectWithAndConditions, apply AND conditions.
        } else if ('or' in this.query) {
            // If it's a QueryObjectWithOrConditions, apply OR conditions.
            const orResults = this.filter(data, this.query.or);
            return data.filter((item) => orResults.includes(item));
        } else {
            debugger;
            // Invalid query object, return an empty array.
            return [];
        }
    }
    addSchema(schema: Schema) {
        // add the schema to the query
        this.schema = schema;
    }
    public get query(): any {
        return this._query;
    }
    public set query(value: any) {
        this._query = value;
    }
    public find(query: any): any[] {
        return [];
    }
    subscribe():Observable<any> {
        return new Observable<any>();
    }
}
export class Query {
    query: QueryObject;
    private _limit: number|null;
    private sortingFn: (a: RDBRecord, b: RDBRecord) => number;
    type: 'fetch'|'insert'|'update'|'delete'
    data: any;
    
    constructor(private table: Table) {
        this.table = table;
        this.type = 'fetch';
        this._limit = null;
        this.sortingFn = (a, b) => 0;
        return this;
    }
    public find(): RDBRecord[] {
        const raw = this.table.data.filter((item) => this.filteringFunctions().every((method) => method(item)))
        if(this._limit) {
            return raw.sort(this.sortingFn).slice(0, this._limit);
        }
        return raw.sort(this.sortingFn);
    }
    public where(query: QueryObject): Query {
        this.query = query;
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
    public async subscribe(fn: (updates: SubscriptionParams ) => void) {
        if(this.type != 'fetch') throw new QueryError(`Only fetch queries can be subscribed to. This query type: '${ this.type }'.`);
        const query = new FetchQuery(this.query);
        const sub = await this.table.subscribe(query, fn);
        return sub.unsubscribe;
    }
    public orderBy(column: string, direction: 'ASC'|'DESC') {
        if(direction == 'ASC') this.sortingFn = (a, b) => a.get(column) - b.get(column);
        else this.sortingFn = (a, b) => b.get(column) - a.get(column);
        return this;
    }

    filteringFunctions(): ((item: RDBRecord) => boolean)[] {
        const functions = [];
        if ( 'column' in this.query ) {
            const { column, value, op } = this.query as QueryObjectWithKey;
            switch (op) {
            case Operators.EQ:
                functions.push((item:RDBRecord) => item.get(column) === value);
                break;
            case Operators.NE:
                functions.push((item:RDBRecord) => item.get(column) !== value);
                break;
            case Operators.GT:
                functions.push((item:RDBRecord) => item.get(column) > value);
                break;
            case Operators.GTE:
                functions.push((item:RDBRecord) => item.get(column) >= value);
                break;
            case Operators.LT:
                functions.push((item:RDBRecord) => item.get(column) < value);
                break;
            case Operators.LTE:
                functions.push((item:RDBRecord) => item.get(column) <= value);
                break;
            case Operators.IN:
                functions.push((item:RDBRecord) => item.get(column).toLowerCase().includes(value.toLowerCase()));
                break;
            // Handle other operators as needed.
            default:
                break;
            }
        } else if( 'and' in this.query ) {
            for( const subQuery of this.query.and) {
                switch (subQuery.op) {
                    case Operators.EQ:
                        functions.push((item:RDBRecord) => item.get(subQuery.column) == subQuery.value);
                        break;
                    case Operators.NE:
                        functions.push((item:RDBRecord) => item.get(subQuery.column) != subQuery.value);
                        break;
                    case Operators.GT:
                        functions.push((item:RDBRecord) => item.get(subQuery.column) > subQuery.value);
                        break;
                    case Operators.GTE:
                        functions.push((item:RDBRecord) => item.get(subQuery.column) >= subQuery.value);
                        break;
                    case Operators.LT:
                        functions.push((item:RDBRecord) => item.get(subQuery.column) < subQuery.value);
                        break;
                    case Operators.LTE:
                        functions.push((item:RDBRecord) => item.get(subQuery.column) <= subQuery.value);
                        break;
                    case Operators.IN:
                        functions.push((item:RDBRecord) => subQuery.value.includes(item.get(subQuery.column)));
                        break;
                    case Operators.NIN:
                        functions.push((item:RDBRecord) => !subQuery.value.includes(item.get(subQuery.column)));
                        break;
                    case Operators.REGEX:
                        functions.push((item:RDBRecord) => new RegExp(subQuery.value).test(item.get(subQuery.column)));
                        break;
                    default:
                        break;
                }
            }
        } else if ( 'or' in this.query ) {
            for( const subQuery of this.query.or) {
                switch (subQuery.op) {
                    case Operators.EQ:
                        functions.push((item:RDBRecord) => item.get(subQuery.column) == subQuery.value);
                        break;
                    case Operators.NE:
                        functions.push((item:RDBRecord) => item.get(subQuery.column) != subQuery.value);
                        break;
                    case Operators.GT:
                        functions.push((item:RDBRecord) => item.get(subQuery.column) > subQuery.value);
                        break;
                    case Operators.GTE:
                        functions.push((item:RDBRecord) => item.get(subQuery.column) >= subQuery.value);
                        break;
                    case Operators.LT:
                        functions.push((item:RDBRecord) => item.get(subQuery.column) < subQuery.value);
                        break;
                    case Operators.LTE:
                        functions.push((item:RDBRecord) => item.get(subQuery.column) <= subQuery.value);
                        break;
                    case Operators.IN:
                        functions.push((item:RDBRecord) => subQuery.value.includes(item.get(subQuery.column)));
                        break;
                    case Operators.NIN:
                        functions.push((item:RDBRecord) => !subQuery.value.includes(item.get(subQuery.column)));
                        break;
                    case Operators.REGEX:
                        functions.push((item:RDBRecord) => new RegExp(subQuery.value).test(item.get(subQuery.column)));
                        break;
                    default:
                        break;
                }
            }   
        } else {
            throw new QueryError("Invalid query object");
        }
        return functions;
    }
    public async execute(){
        if(this.type == 'fetch') return this.find();
        if(this.type == 'insert') {
            if(this.data) return await this.table.insert(this.data);
            else throw new QueryError("No data to insert");
        }
        const fetchQuery = new FetchQuery(this.query);
        if(this.type == 'update') {
            if (this.data ) return this.table.update(fetchQuery, this.data);
            else throw new QueryError("No data to update");
        }
        else if(this.type == 'delete') return this.table.delete( fetchQuery ); // This doesnt respect limiting or sorting
    }
}
export type InsertQuery = Record<string, any>