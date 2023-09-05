import { Mutex } from "./Utils";
import { FetchQuery, InsertQuery, Operators, QueryForInsert, QueryObject, QueryObjectWithKey } from "./Query";
const Ajv = require("ajv");
const ajv = new Ajv();
import addFormats from "ajv-formats"
import { DatabaseError, QueryError, SchemaError } from "./Errors";
import { RDBRecord } from "./Record";
const fs = require("fs");
const path = require("path");
addFormats(ajv)

export type SubscriptionParams = {
    added: any[],
    removed: any[],
    updated: any[]
}
export type TableSchema = {
    name: string,
    columns: Column[]
}
type DatabaseOptions = {
    schemas?: TableSchema[],
    directory?: string
}
export type Column = {
    name: string,
    type: string,
    required?: boolean
    format?: string
    unique?: boolean
    nullable?: boolean
    minLength?: number
    maxLength?: number
    minimum?: number
    maximum?: number
    validationFn?: (value: any)=>boolean
}
// export class Schema {
//     customValidateFns:Map<string, (value: any)=>boolean> = new Map();
//     constructor(public name:string, public columns: Column[]) {

//     }
//     get ColumnNames() {
//         return this.columns.map((item) => item.name);
//     }
//     get requiredColumns() {
//         return this.columns.filter((item) => item.required);
//     }
//     validate(data: object) {
//         this.columns.forEach((item) => {
//             if (!(item.name in data)) throw new SchemaError(`Column ${item.name} is required but was not provided`)
//             // check the type
//             const type = item.type;
//             if (typeof data[item.name] != type) throw new SchemaError(`Column ${item.name} is of type ${type} but received type ${typeof data[item.name]}`)
//             // check the validationFn
//             if(item.validationFn){
//                 if(!item.validationFn(data[item.name])) throw new DatabaseError(`Column ${item.name} failed custom validation function`)
//             }
//         })
//     }
//     toJSON(){
//         return {
//             name: this.name,
//             columns: Object.fromEntries(this.columns.map((item)=>[item.name, item])),
//         }
//     }
// }
export class Table {
    private _mutex: Mutex = new Mutex();
    filePath: string;
    validateSchema: any;
    columns: string[];
    name: string;
    private subscriptions: Set<{query:(QueryObject|FetchQuery),fn:(results: RDBRecord[],updates: SubscriptionParams)=>void, current: RDBRecord[]}> = new Set();
    schema: TableSchema;
    constructor(schema: TableSchema, private filepath: string) {
        if(!('columns' in schema)) throw new DatabaseError(`Schema for table '${name}' does not have columns defined.`)
        this.name = schema.name;
        this.schema = schema;
        if(!fs.existsSync(this.filepath)) {
            // @ts-ignore
            console.log(`Creating table ${this.name} with columns: ${Object.keys(schema.schema.columns).join(', ')}`)
            fs.writeFileSync(this.filePath, JSON.stringify({
                schema: schema,
                data: []
            }, null, 2));
        } else {
            console.log(`Table '${this.name}' exists`)
        }
    }
    async insert(data: QueryForInsert) {
        await this._mutex.lock();
        // validate data against schema
        const columns = Object.keys(data);
        // get the highest id
        const highestID = this.data.reduce((acc, item)=>{
            if(item.id > acc) return item.id;
            return acc;
        }, 0);
        data.id = (Number(highestID) + 1).toString();
        Object.keys(this.schema.columns).filter( c=>this.schema.columns[c].required).forEach(item => {
            if(!(item in columns)) throw new Error(`Error inserting into table ${this.name}: Column '${item}' is required but was not provided. This is case-sensitive. Valid columns are: ${this.columns.join(', ')}`)
        });
        for(const columnName of columns){
            if(!this.columns.includes(columnName)) throw new Error(`Error inserting into table ${this.name}: Column '${columnName}' does not exist in table ${this.name}. This is case-sensitive. Valid columns are: ${this.columns.join(', ')}`)
                if(this.schema.columns[columnName]?.unique){
                    const found = this.data.find((item)=>item[columnName] === data[columnName]);
                    if(found) throw new Error(`Error inserting into table ${this.name}: Column '${columnName}' is unique but a record with this value already exists`)
                }
            const type = this.schema.columns[columnName].type;
            if(typeof data[columnName] != type) throw new Error(`Error inserting into table ${this.name}: Column '${columnName}' is of type '${type}' but received type '${typeof data[columnName]}'`)

            if(this.schema.columns[columnName]?.unique){
                const found = this.data.find((item)=>{
                    return item.get(columnName) == data[columnName]
                });
                if(found) throw new Error(`Error inserting into table ${this.name}: Column '${columnName}' is unique but a record with this '${columnName}: ${data[columnName]}' already exists: ${found.get('id')}`)
            }
        }
        // insert the data
        const file = fs.readFileSync(this.filePath, "utf-8");
        const parsed = JSON.parse(file);
        parsed.data.push(data);
        fs.writeFileSync(this.filePath, JSON.stringify(parsed, null, 2));
        this._mutex.unlock();
        return new RDBRecord(data, this);
    }
    async remove(query: FetchQuery): Promise<boolean> {
        const records = await this.find(query)
        if(records.length === 0) return false;
        for(const record of records){
            if(!(await record.remove())) return false;
        }
        return true;
    }
    async update(query:FetchQuery, data: InsertQuery) {
        await this._mutex.lock();
        const records = await this.find(query);
        let affectedRows = 0;
        records.forEach((record)=>{
            Object.keys(data).forEach((key)=>{
                record.set(key, data[key]);
            })
            if(record.save()) affectedRows++;
        });
        this._mutex.unlock();
        return affectedRows
    }
    async find(query: QueryObject|FetchQuery) {
        // const data = fs.readFileSync(this.filePath, "utf-8");
        if(query instanceof FetchQuery){
            this.checkSchema(query.affectingColumns());
        }
        return this.filter(query);
    }
    private filter(query: QueryObject|FetchQuery){
        // get the filtering function()
        if(query instanceof FetchQuery){
            const filteringFunctions = query.filteringFunctions();
            if(filteringFunctions.length === 0) throw new QueryError("No filtering functions found")
            if( 'and' in query.query ){
                return this.data.filter(item => {
                    return filteringFunctions.every(fn => fn(item))
                });
            } else if ( 'or' in query.query ){
                return this.data.filter(item => {
                    return filteringFunctions.some(fn => fn(item))
                });
            } else {
                return this.data.filter(item => {
                    return filteringFunctions[0](item)
                });
            }
        }
        debugger
        return this.data.filter(item => {
            return true;
        })
    }
    get data(): RDBRecord[] {
        return JSON.parse(fs.readFileSync(this.filepath, "utf-8")).data.map((item:object) => {
            return new RDBRecord(item, this);
        });
    }
    private checkSchema(data: string[]) {
        data.forEach(this.checkColumnName.bind(this));
    }
    checkColumnName(name:string){
        if (!this.columnNames.includes(name)) throw new QueryError(`Column '${name}' does not exist in table ${this.name}. This is case-sensitive. Valid columns are: ${this.columnNames.join(', ')}`)
    }
    get columnNames() {
        return Object.keys(this.schema.columns);
    }
    async findOne(query: FetchQuery):Promise<RDBRecord> {
        return await this.find(query)[0];
    }
    async delete(query: FetchQuery): Promise<boolean> {
        return false;
    }
    drop(): void {
        // delete the file
    }
    private runSubscriptions() {
        this.subscriptions.forEach(subscription => {
            const newData = this.filter(subscription.query);
            if(JSON.stringify(newData) !== JSON.stringify(subscription.current)){
                const newIDs = newData.map((i=>i.id))
                const oldIDs = subscription.current.map((i=>i.id))
                const addedFn = (item)=>!oldIDs.includes(item.id)
                const removedFn = (item)=>!newIDs.includes(item.id)
                const updatedFn = (item)=>{
                    if( oldIDs.includes(item.id) && newIDs.includes(item.id)){
                        if(JSON.stringify(subscription.current.find(i=>i.id === item.id)) !== JSON.stringify(newData.find(i=>i.id === item.id))){
                            return true
                        }
                    }
                    return false
                }
                subscription.fn( newData, {
                    added: newData.filter(addedFn),
                    removed: subscription.current.filter(removedFn),
                    updated: newData.filter(updatedFn)
                });
                subscription.current = newData;
            }
        });
    }
    async subscribe(query: QueryObject|FetchQuery ,fn: (results: RDBRecord[], updates: SubscriptionParams) => void) {
        if(!this.subscriptions.size){
            // start watching the file
            fs.watchFile(this.filepath,{interval: 1000}, (curr, prev) => {
                this.runSubscriptions();
            });
        }
        // get the data
        let data = null; 
        if(query instanceof FetchQuery){
            this.checkSchema(query.affectingColumns());
            const filteringFunctions = query.filteringFunctions();
            if(filteringFunctions.length === 0) throw new QueryError("No filtering functions found")
            if( 'and' in query.query ){
                data = this.data.filter(item => {
                    return filteringFunctions.every(fn => fn(item))
                });
            } else if ( 'or' in query.query ){
                data = this.data.filter(item => {
                    return filteringFunctions.some(fn => fn(item))
                });
            } else {
                data = this.data.filter(item => {
                    return filteringFunctions[0](item)
                });
            }
            await fn(data, {added: data, removed: [], updated: []})
            this.subscriptions.add({query, fn, current: data});
        } else {
            debugger
        }
        return {
            unsubscribe: ()=>{
                this.subscriptions.delete({query, fn, current: data});
            }
        }
    }
}
export class RDatabase {
    mutex: Mutex = new Mutex();
    directory: string;
    tables: Map<string, Table> = new Map();
    constructor(options: DatabaseOptions) {
        if(!options?.schemas?.length && !options?.directory) throw new Error("No schemas or directory provided")
        if(options.directory){
            this.directory = options.directory;
            // get all files in directory
            const files = fs.readdirSync(options.directory);
            // check if the name matches pattern /*_table.json/
            const TableFiles = files.filter((file)=>file.match(/.*_table.json/));
            console.log(TableFiles.length, "tables found in "+options.directory);
            if(TableFiles.length === 0) throw new DatabaseError("No tables found in "+options.directory);
            const schemas = files.filter((file)=>{
                return file.match(/.*_table.json/)
            }).map((file)=>{
                // const usersSchema = new Schema("users", [
                //     {
                //         name: "id",
                //         type: "string",
                //         unique: true,
                //         required: true,
                //     },
                //     {
                //         name: "name",
                //         type: "string",
                //         required: true,
                //     },
                //     {
                //         name: "email",
                //         type: "string",
                //         format: "email",
                //         required: true,
                //     },
                //     {
                //         name: "age",
                //         type: "number",
                //         required: true,
                //     },
                //     {
                //         name: "isAdmin",
                //         type: "boolean",
                //         required: true,
                //     },
                //     {
                //         name: "password",
                //         type: "string",
                //         required: true,
                //     },
                //     {
                //         name: "createdAt",
                //         type: "string",
                //         format: "date",
                //         required: true,
                //     },
                //     {
                //         name: "updatedAt",
                //         type: "string",
                //         format: "date",
                //         required: true,
                //     }
                // ])
                // const schemaData = JSON.parse(fs.readFileSync(path.resolve(__dirname, file), "utf-8"));
                // const schema = new Schema(schemaData.schema.name, [
                //     {
                //         name: "id",
                //         type: "string",
                //         unique: true,
                //         required: true,
                //     },
                //     {
                //         name: "title",
                //         type: "string",
                //         required: true,
                //     },
                //     {
                //         name: "body",
                //         type: "string",
                //         required: true,
                //     },
                //     {
                //         name: "createdAt",
                //         type: "string",
                //         format: "date",
                //         required: true,
                //     },
                //     {
                //         name: "updatedAt",
                //         type: "string",
                //         format: "date",
                //         required: true,
                //     }
                // ]);
                // // schema.schema.name = file.replace('_table.json', '');
                // const filepath = path.resolve(__dirname, file);
                // this.tables.set(schema.name ,new Table(schema, filepath));
                // return this.tables.get(schema.name);
            })
        } else if (options.schemas) {
            this.directory = path.resolve(__dirname, "./");
            this.tables = this.create(options.schemas);
        }
    }
    create(schemas:TableSchema[]):Map<string, Table> {
        const ret = new Map();
        schemas.forEach(schema => {
            const table = new Table( schema, this.directory);
            ret.set(schema.name, table);
        });
        return ret;
    }
}