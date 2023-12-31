import { Mutex } from "./Utils";
import { InsertQuery, Query } from "./Query";
import { DatabaseError, QueryError } from "./Errors";
import { RDBRecord } from "./Record";
import {
    ValidateArrayLength,
    ValidateBoolean,
    ValidateEmail,
    ValidateISODate,
    ValidateNumeric,
    ValidateString,
    ValidateURL,
    ValidationType } from "./Validations";
import { existsSync, writeFileSync, readFileSync, unlinkSync, watchFile, readdirSync, mkdirSync } from "fs";
const path = require("path");

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
    directory: string
}
export type Column = {
    name: string,
    autoIncrement?: boolean,
    type: ValidationType,
    enum?: (string|number|boolean)[],
    default?: any
    required?: boolean
    format?: string
    unique?: boolean
    nullable?: boolean
    minLength?: number
    maxLength?: number
    minimum?: number
    maximum?: number
}
// I need a type for the data that can be inserted into the table

export type InsertData = {
    [key: string]: any
}
export class Table {
    private _mutex: Mutex = new Mutex();
    columns: Column[];
    name: string;
    private dropped: boolean = false;
    subscriptions: {current: RDBRecord[], query: Query}[] = [];
    constructor(private readonly schema: TableSchema, private filepath: string) {
        if(!('columns' in schema)) throw new DatabaseError(`Schema does not have columns defined.`)
        this.name = schema.name;
        if(!existsSync(this.filepath)) {
            // @ts-ignore
            writeFileSync(this.filepath, JSON.stringify({
                schema,
                autoIncrement: 0,
                lastInsertID: 0,
                data: []
            }, null, 2));
        }
        this.columns = schema.columns;
    }
    async insert(data:InsertData) {
        if(this.dropped) throw new QueryError(`Table '${this.name}' no longer exists`, `insert into ${this.name} (${Object.keys(data).join(', ')}) values (${Object.values(data).join(', ')}`)
        await this._mutex.lock();
        // validate data against schema
        const columns = Object.keys(data);
        const lastInsertID = await this.getInsertID();
        if(data instanceof RDBRecord) data = data.toJSON();
        data.id = lastInsertID + 1;
        data.createdAt = new Date().toISOString();
        data.updatedAt = new Date().toISOString();
        const requiredColumns = this.schema.columns.filter( c=>c.required);
        requiredColumns.forEach(column => {
            if(!columns.includes(column.name)) throw new QueryError(`Error inserting into table ${this.name}: Column '${column.name}' is required but was not provided. This is case-sensitive. Valid columns are: ${this.schema.columns.map(c=>c.name).join(', ')}`, `insert into ${this.name} (${Object.keys(data).join(', ')}) values (${Object.values(data).join(', ')}`)
        });
        for(const columnName of this.schema.columns.map((item)=>item.name)){
            const column = this.schema.columns.filter(c=>c.name == columnName)[0];
            if(!this.columnNames.includes(columnName)) throw new Error(`Error inserting into table ${this.name}: Column '${columnName}' does not exist in table ${this.name}. This is case-sensitive. Valid columns are: ${this.columnNames.join(', ')}`)
                if(column?.unique){
                    const found = this.data.find((item)=>item.get(columnName) == data[columnName]);
                    if(found) throw new QueryError(`Error inserting into table ${this.name}: Column '${columnName}' is unique but a record with this value already exists`, `insert into ${this.name} (${Object.keys(data).join(', ')}) values (${Object.values(data).join(', ')}`)
                }

            if(!this.validate(data[columnName], column)) throw new QueryError(`Error inserting into table ${this.name}: Column '${columnName}' failed validation`, `insert into ${this.name} (${Object.keys(data).join(', ')}) values (${Object.values(data).join(', ')}`)

            if(column.unique){
                const found = this.data.find((item)=>{
                    // @ts-ignore
                    return item.get(columnName) == data[columnName]
                });
                if(found) throw new Error(`Error inserting into table ${this.name}: Column '${columnName}' is unique but a record with this '${columnName}: ${data[columnName]}' already exists: ${found.get('id')}`)
            }
        }
        // insert the data
        const file = readFileSync(this.filepath, "utf-8");
        const parsed = JSON.parse(file);
        parsed.data.push(data);
        writeFileSync(this.filepath, JSON.stringify(parsed, null, 2));
        await this.incrementInsertID();
        this._mutex.unlock();
        return new RDBRecord(data, this);
    }
    /**
     * Removes a record from the table
     * @param query
     * @returns {number} - the number of rows affected
     */
    async remove(query: RDBRecord): Promise<number> {
        if(this.dropped) throw new QueryError(`Table '${this.name}' no longer exists`, `delete from ${this.name} where id = ${query.id}`)
        this._mutex.lock();
        this.data.splice(this.data.findIndex((item)=>item.id == query.id), 1);
        const file = readFileSync(this.filepath, "utf-8");
        const parsed = JSON.parse(file);
        const precount = parsed.data.length;
        parsed.data = this.data;
        writeFileSync(this.filepath, JSON.stringify(parsed, null, 2));
        this._mutex.unlock();
        return precount - parsed.data.length;
    }
    async update(query:Query, data: InsertQuery) {
        if(this.dropped) throw new QueryError(`Table '${this.name}' no longer exists`, `update ${this.name} set ${Object.keys(data).map((key)=>`${key} = ${data[key]}`).join(', ')} where ${query.toString()}`)
        await this._mutex.lock();
        const records = await this.find(query);
        let affectedRows = 0;
        records.forEach((record)=>{
            Object.keys(data).forEach((key)=>{
                record.update('updatedAt', new Date().toISOString(), false)
                record.update(key, data[key], false);
            })
            if(record.save()) affectedRows++;
        });
        this._mutex.unlock();
        return affectedRows
    }
    async find(query: Query) {
        if(this.dropped) throw new QueryError(`Table '${this.name}' no longer exists`, query.toString())
        return await query.find();
    }
    get data(): RDBRecord[] {
        return JSON.parse(readFileSync(this.filepath, "utf-8")).data.map((item:object) => {
            return new RDBRecord(item, this);
        });
    }
    validate(data: any, against: Column) {
        if(against?.enum) {
            if(!against.enum.includes(data)) return false;
        }
        switch (against.type) {
            case ValidationType.EMAIL:
                return ValidateEmail(data);
            case ValidationType.DATE:
                return ValidateISODate(data);
            case ValidationType.URL:
                return ValidateURL(data);
            case ValidationType.ARRAY:
                return ValidateArrayLength(data, against?.minLength||1, against?.maxLength||255);
            case ValidationType.STRING:
                return ValidateString(data, against?.minLength||1, against?.maxLength||5000); // What is a reasonable maximum here?
            case ValidationType.NUMBER:
                return ValidateNumeric(data, against?.minimum||0, against?.maximum||1999999999999999);
            case ValidationType.BOOLEAN:
                return ValidateBoolean(data);
        }
    }
    get filePath() {
        return this.filepath;
    }
    get columnNames() {
        return this.schema.columns.map((item) => item.name);
    }
    get size() {
        return this.data.length;
    }
    private async getInsertID() {
        const file = readFileSync(this.filepath, "utf-8");
        const parsed = JSON.parse(file);
        const highestID:number = parsed.lastInsertID;
        return highestID;
    }
    private async incrementInsertID() {
        const file = readFileSync(this.filepath, "utf-8");
        const parsed = JSON.parse(file);
        const highestID:number = parsed.lastInsertID;
        parsed.lastInsertID = highestID + 1;
        writeFileSync(this.filepath, JSON.stringify(parsed, null, 2));
        return highestID + 1;
    }
    async findOne(query: Query):Promise<RDBRecord> {
        const tempQuery = new Query(this);
        tempQuery.query = query.query;
        tempQuery.limit(1);
        return await tempQuery.find()[0];
    }
    /**
     * Deletes records from the table
     * @param query the query to find which records to delete
     * @returns a function that will revert the changes when called
     */
    async delete(query: Query) {
        const records = await this.find(query);
        records.forEach((record)=>{
            record.remove();
        });
        return ()=>{
            records.forEach((record)=>{
                this.insert(record.toJSON());
            });
        };
    }
    /**
     * Drops the table and deletes the file
     */
    drop() {
        this.dropped = true
        fs.unlinkSync(this.filepath);
        // Explicit clean up for garbage collection
        this.subscriptions.forEach((sub)=>{
            sub.query.removeAllListeners();
        })
    }
    async subscribe(query: Query) {
        if(query.type != 'fetch') throw new QueryError("Only Fetch Queries can be subscribed", query.toString());
        
        this.subscriptions.push({ current: query.find(), query });

        if(this.subscriptions.length == 1){
            // start watching the file
            watchFile(this.filepath,{interval: 1000}, () => {
                this.subscriptions.forEach((query)=>{
                    run.bind(this)(query)
                });
            });
        }
        function run(query:{current: RDBRecord[], query: Query}){
            const newData = query.query.find();
            if(JSON.stringify(newData) !== JSON.stringify(query.current)){
                const newIDs = newData.map((i=>i.id))
                const oldIDs = query.current.map((i=>i.id))
                const addedFn = (item:RDBRecord)=>{
                    return !oldIDs.includes(item.id)
                }
                const removedFn = (item:RDBRecord)=>{
                    return !newIDs.includes(item.id)
                }
                const updatedFn = (item:RDBRecord)=>{
                    if( oldIDs.includes(item.id) && newIDs.includes(item.id)){
                        if(JSON.stringify(query.current.find(i=>i.id == item.id)) !== JSON.stringify(newData.find(i=>i.id == item.id))){
                            return true
                        }
                    }
                    return false
                }
                const whatHasBeenRemoved = query.current.filter(removedFn)
                const whatHasBeenAdded = newData.filter(addedFn)
                whatHasBeenAdded.forEach((item)=>{
                    query.query.emit('added', item, newData)
                })
                whatHasBeenRemoved.forEach((item)=>{
                    query.query.emit('removed', item, newData)
                })
                newData.filter(updatedFn).forEach((item)=>{
                    query.query.emit('updated', item, newData)
                })
                query.current = newData;
            }
        }
    }
}
export class RDatabase {
    /**
     * A mutex to prevent multiple threads from accessing the database at the same time
     * This should not be accessed directly
     */
    mutex: Mutex = new Mutex();
    directory: string;
    tables: Map<string, Table> = new Map();
    constructor(options: DatabaseOptions) {
        // We need two cases here:
        // 1. We are given an array of schemas with a directory
        // 2. We are given a directory with no schemas
        // all others throw an error
        if(!options?.schemas?.length && !options?.directory) throw new Error("No schemas or directory provided")
        if(!options?.directory) throw new Error("No directory provided")

        this.directory = options.directory;
        // create the directory if it doesn't exist
        if(!existsSync(this.directory)) mkdirSync(this.directory);
        // get all files in directory
        const files:string[] = readdirSync(options.directory);
        // check if the name matches pattern /*_table.json/
        const TableFiles = files.filter((file)=>file.match(/.*_table.json/));
        if(TableFiles.length > 0) {
            const schemas = files.filter((file)=>{
                return file.match(/.*_table.json/)
            }).map((file)=>{
                const filepath = path.resolve(options.directory, file);
                const data = JSON.parse(readFileSync(filepath, "utf-8"));
                const schema = data.schema;
                return [schema,filepath];
            });
            schemas.forEach((data)=>{
                this.tables.set(data[0].name ,new Table(data[0], data[1] ));
            });
        }
        if (options.schemas) {
            this.directory = path.resolve(__dirname, "./");
            this.tables = this.create(options.schemas);
        }
    }
    /**
     * Creates a table
     */
    create(schemas:TableSchema[]):Map<string, Table> {
        const ret = new Map();
        schemas.forEach(schema => {
            const table = new Table( schema, path.resolve(this.directory,`${schema.name}_table.json`));
            this.tables.set(schema.name, table);
            ret.set(schema.name, table);
        });
        return ret;
    }
    /**
     * Drops a table (delete table file)
     */
    drop(table: string) {
        this.tables.get(table)?.drop();
        this.tables.delete(table);
    }
}