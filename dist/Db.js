"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RDatabase = exports.Table = void 0;
const Utils_1 = require("./Utils");
const Query_1 = require("./Query");
const Errors_1 = require("./Errors");
const Record_1 = require("./Record");
const Validations_1 = require("./Validations");
const fs = require("fs");
const path = require("path");
class Table {
    constructor(schema, filepath) {
        this.schema = schema;
        this.filepath = filepath;
        this._mutex = new Utils_1.Mutex();
        this.dropped = false;
        this.subscriptions = [];
        if (!('columns' in schema))
            throw new Errors_1.DatabaseError(`Schema does not have columns defined.`);
        this.name = schema.name;
        if (!fs.existsSync(this.filepath)) {
            // @ts-ignore
            fs.writeFileSync(this.filepath, JSON.stringify({
                schema: schema,
                autoIncrement: 0,
                lastInsertID: 0,
                data: []
            }, null, 2));
        }
        this.columns = schema.columns;
    }
    insert(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.dropped)
                throw new Errors_1.QueryError(`Table '${this.name}' no longer exists`);
            yield this._mutex.lock();
            // validate data against schema
            const columns = Object.keys(data);
            const lastInsertID = yield this.getInsertID();
            if (data instanceof Record_1.RDBRecord)
                data = data.toJSON();
            data.id = lastInsertID + 1;
            data.createdAt = new Date().toISOString();
            data.updatedAt = new Date().toISOString();
            const requiredColumns = this.schema.columns.filter(c => c.required);
            requiredColumns.forEach(column => {
                if (!columns.includes(column.name))
                    throw new Errors_1.QueryError(`Error inserting into table ${this.name}: Column '${column.name}' is required but was not provided. This is case-sensitive. Valid columns are: ${this.schema.columns.map(c => c.name).join(', ')}`);
            });
            for (const columnName of this.schema.columns.map((item) => item.name)) {
                const column = this.schema.columns.filter(c => c.name == columnName)[0];
                if (!this.columnNames.includes(columnName))
                    throw new Error(`Error inserting into table ${this.name}: Column '${columnName}' does not exist in table ${this.name}. This is case-sensitive. Valid columns are: ${this.columnNames.join(', ')}`);
                if (!this.validate(data[columnName], column))
                    throw new Errors_1.QueryError(`Error inserting into table ${this.name}: Column '${columnName}' failed validation`);
                if (column.unique) {
                    const found = this.data.find((item) => {
                        // @ts-ignore
                        return item.get(columnName) == data[columnName];
                    });
                    if (found)
                        throw new Error(`Error inserting into table ${this.name}: Column '${columnName}' is unique but a record with this '${columnName}: ${data[columnName]}' already exists: ${found.get('id')}`);
                }
            }
            // insert the data
            const file = fs.readFileSync(this.filepath, "utf-8");
            const parsed = JSON.parse(file);
            parsed.data.push(data);
            fs.writeFileSync(this.filepath, JSON.stringify(parsed, null, 2));
            yield this.incrementInsertID();
            this._mutex.unlock();
            return new Record_1.RDBRecord(data, this);
        });
    }
    /**
     * Removes a record from the table
     * @param query
     * @returns {number} - the number of rows affected
     */
    remove(query) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.dropped)
                throw new Errors_1.QueryError(`Table '${this.name}' no longer exists`);
            this._mutex.lock();
            this.data.splice(this.data.findIndex((item) => item.id == query.id), 1);
            const file = fs.readFileSync(this.filepath, "utf-8");
            const parsed = JSON.parse(file);
            const precount = parsed.data.length;
            parsed.data = this.data;
            fs.writeFileSync(this.filepath, JSON.stringify(parsed, null, 2));
            this._mutex.unlock();
            return precount - parsed.data.length;
        });
    }
    update(query, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.dropped)
                throw new Errors_1.QueryError(`Table '${this.name}' no longer exists`);
            yield this._mutex.lock();
            const records = yield this.find(query);
            let affectedRows = 0;
            records.forEach((record) => {
                Object.keys(data).forEach((key) => {
                    record.update('updatedAt', new Date().toISOString(), false);
                    record.update(key, data[key], false);
                });
                if (record.save())
                    affectedRows++;
            });
            this._mutex.unlock();
            return affectedRows;
        });
    }
    find(query) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.dropped)
                throw new Errors_1.QueryError(`Table '${this.name}' no longer exists`);
            return yield query.find();
        });
    }
    get data() {
        return JSON.parse(fs.readFileSync(this.filepath, "utf-8")).data.map((item) => {
            return new Record_1.RDBRecord(item, this);
        });
    }
    validate(data, against) {
        if (against === null || against === void 0 ? void 0 : against.enum) {
            if (!against.enum.includes(data))
                return false;
        }
        switch (against.type) {
            case Validations_1.ValidationType.EMAIL:
                return (0, Validations_1.ValidateEmail)(data);
            case Validations_1.ValidationType.DATE:
                return (0, Validations_1.ValidateISODate)(data);
            case Validations_1.ValidationType.URL:
                return (0, Validations_1.ValidateURL)(data);
            case Validations_1.ValidationType.ARRAY:
                return (0, Validations_1.ValidateArrayLength)(data, (against === null || against === void 0 ? void 0 : against.minLength) || 1, (against === null || against === void 0 ? void 0 : against.maxLength) || 255);
            case Validations_1.ValidationType.STRING:
                return (0, Validations_1.ValidateString)(data, (against === null || against === void 0 ? void 0 : against.minLength) || 1, (against === null || against === void 0 ? void 0 : against.maxLength) || 5000); // What is a reasonable maximum here?
            case Validations_1.ValidationType.NUMBER:
                return (0, Validations_1.ValidateNumeric)(data, (against === null || against === void 0 ? void 0 : against.minimum) || 0, (against === null || against === void 0 ? void 0 : against.maximum) || 1999999999999999);
            case Validations_1.ValidationType.BOOLEAN:
                return (0, Validations_1.ValidateBoolean)(data);
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
    getInsertID() {
        return __awaiter(this, void 0, void 0, function* () {
            const file = fs.readFileSync(this.filepath, "utf-8");
            const parsed = JSON.parse(file);
            const highestID = parsed.lastInsertID;
            return highestID;
        });
    }
    incrementInsertID() {
        return __awaiter(this, void 0, void 0, function* () {
            const file = fs.readFileSync(this.filepath, "utf-8");
            const parsed = JSON.parse(file);
            const highestID = parsed.lastInsertID;
            parsed.lastInsertID = highestID + 1;
            fs.writeFileSync(this.filepath, JSON.stringify(parsed, null, 2));
            return highestID + 1;
        });
    }
    findOne(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const tempQuery = new Query_1.Query(this);
            tempQuery.query = query.query;
            tempQuery.limit(1);
            return yield tempQuery.find()[0];
        });
    }
    /**
     * Deletes records from the table
     * @param query the query to find which records to delete
     * @returns a function that will revert the changes when called
     */
    delete(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const records = yield this.find(query);
            records.forEach((record) => {
                record.remove();
            });
            return () => {
                records.forEach((record) => {
                    this.insert(record.toJSON());
                });
            };
        });
    }
    /**
     * Drops the table and deletes the file
     */
    drop() {
        this.dropped = true;
        fs.unlinkSync(this.filepath);
    }
    subscribe(query) {
        return __awaiter(this, void 0, void 0, function* () {
            if (query.type != 'fetch')
                throw new Errors_1.QueryError("Only Fetch Queries can be subscribed");
            this.subscriptions.push({ current: query.find(), query });
            if (this.subscriptions.length == 1) {
                // start watching the file
                fs.watchFile(this.filepath, { interval: 1000 }, () => {
                    this.subscriptions.forEach((query) => {
                        run.bind(this)(query);
                    });
                });
            }
            function run(query) {
                const newData = query.query.find();
                if (JSON.stringify(newData) !== JSON.stringify(query.current)) {
                    const newIDs = newData.map((i => i.id));
                    const oldIDs = query.current.map((i => i.id));
                    const addedFn = (item) => {
                        return !oldIDs.includes(item.id);
                    };
                    const removedFn = (item) => {
                        return !newIDs.includes(item.id);
                    };
                    const updatedFn = (item) => {
                        if (oldIDs.includes(item.id) && newIDs.includes(item.id)) {
                            if (JSON.stringify(query.current.find(i => i.id == item.id)) !== JSON.stringify(newData.find(i => i.id == item.id))) {
                                return true;
                            }
                        }
                        return false;
                    };
                    const whatHasBeenRemoved = query.current.filter(removedFn);
                    const whatHasBeenAdded = newData.filter(addedFn);
                    whatHasBeenAdded.forEach((item) => {
                        query.query.emit('added', item, newData);
                    });
                    whatHasBeenRemoved.forEach((item) => {
                        query.query.emit('removed', item, newData);
                    });
                    newData.filter(updatedFn).forEach((item) => {
                        query.query.emit('updated', item, newData);
                    });
                    query.current = newData;
                }
            }
        });
    }
}
exports.Table = Table;
class RDatabase {
    constructor(options) {
        var _a;
        /**
         * A mutex to prevent multiple threads from accessing the database at the same time
         * This should not be accessed directly
         */
        this.mutex = new Utils_1.Mutex();
        this.tables = new Map();
        if (!((_a = options === null || options === void 0 ? void 0 : options.schemas) === null || _a === void 0 ? void 0 : _a.length) && !(options === null || options === void 0 ? void 0 : options.directory))
            throw new Error("No schemas or directory provided");
        if (options.directory) {
            this.directory = options.directory;
            // get all files in directory
            const files = fs.readdirSync(options.directory);
            // check if the name matches pattern /*_table.json/
            const TableFiles = files.filter((file) => file.match(/.*_table.json/));
            if (TableFiles.length == 0) {
                throw new Errors_1.DatabaseError("No tables found in " + options.directory);
            }
            else {
                const schemas = files.filter((file) => {
                    return file.match(/.*_table.json/);
                }).map((file) => {
                    const filepath = path.resolve(options.directory, file);
                    const data = JSON.parse(fs.readFileSync(filepath, "utf-8"));
                    const schema = data.schema;
                    return [schema, filepath];
                });
                schemas.forEach((data) => {
                    this.tables.set(data[0].name, new Table(data[0], data[1]));
                });
            }
        }
        else if (options.schemas) {
            this.directory = path.resolve(__dirname, "./");
            this.tables = this.create(options.schemas);
        }
        else {
            throw new Error("No schemas or directory provided");
        }
    }
    /**
     * Creates a table
     */
    create(schemas) {
        const ret = new Map();
        schemas.forEach(schema => {
            const table = new Table(schema, path.resolve(this.directory, `${schema.name}_table.json`));
            this.tables.set(schema.name, table);
            ret.set(schema.name, table);
        });
        return ret;
    }
    /**
     * Drops a table (delete table file)
     */
    drop(table) {
        var _a;
        (_a = this.tables.get(table)) === null || _a === void 0 ? void 0 : _a.drop();
        this.tables.delete(table);
    }
}
exports.RDatabase = RDatabase;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGIuanMiLCJzb3VyY2VSb290IjoiLi4vc3JjLyIsInNvdXJjZXMiOlsiRGIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsbUNBQWdDO0FBQ2hDLG1DQUE2QztBQUM3QyxxQ0FBcUQ7QUFDckQscUNBQXFDO0FBQ3JDLCtDQUFtSztBQUNuSyxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekIsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBbUM3QixNQUFhLEtBQUs7SUFNZCxZQUE2QixNQUFtQixFQUFVLFFBQWdCO1FBQTdDLFdBQU0sR0FBTixNQUFNLENBQWE7UUFBVSxhQUFRLEdBQVIsUUFBUSxDQUFRO1FBTGxFLFdBQU0sR0FBVSxJQUFJLGFBQUssRUFBRSxDQUFDO1FBRzVCLFlBQU8sR0FBWSxLQUFLLENBQUM7UUFDakMsa0JBQWEsR0FBMkMsRUFBRSxDQUFDO1FBRXZELElBQUcsQ0FBQyxDQUFDLFNBQVMsSUFBSSxNQUFNLENBQUM7WUFBRSxNQUFNLElBQUksc0JBQWEsQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFBO1FBQzNGLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQztRQUN4QixJQUFHLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDOUIsYUFBYTtZQUNiLEVBQUUsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUMzQyxNQUFNLEVBQUUsTUFBTTtnQkFDZCxhQUFhLEVBQUUsQ0FBQztnQkFDaEIsWUFBWSxFQUFFLENBQUM7Z0JBQ2YsSUFBSSxFQUFFLEVBQUU7YUFDWCxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2hCO1FBQ0QsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDO0lBQ2xDLENB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