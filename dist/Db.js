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
const fs_1 = require("fs");
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
        if (!(0, fs_1.existsSync)(this.filepath)) {
            // @ts-ignore
            (0, fs_1.writeFileSync)(this.filepath, JSON.stringify({
                schema,
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
            const file = (0, fs_1.readFileSync)(this.filepath, "utf-8");
            const parsed = JSON.parse(file);
            parsed.data.push(data);
            (0, fs_1.writeFileSync)(this.filepath, JSON.stringify(parsed, null, 2));
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
            const file = (0, fs_1.readFileSync)(this.filepath, "utf-8");
            const parsed = JSON.parse(file);
            const precount = parsed.data.length;
            parsed.data = this.data;
            (0, fs_1.writeFileSync)(this.filepath, JSON.stringify(parsed, null, 2));
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
        return JSON.parse((0, fs_1.readFileSync)(this.filepath, "utf-8")).data.map((item) => {
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
            const file = (0, fs_1.readFileSync)(this.filepath, "utf-8");
            const parsed = JSON.parse(file);
            const highestID = parsed.lastInsertID;
            return highestID;
        });
    }
    incrementInsertID() {
        return __awaiter(this, void 0, void 0, function* () {
            const file = (0, fs_1.readFileSync)(this.filepath, "utf-8");
            const parsed = JSON.parse(file);
            const highestID = parsed.lastInsertID;
            parsed.lastInsertID = highestID + 1;
            (0, fs_1.writeFileSync)(this.filepath, JSON.stringify(parsed, null, 2));
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
        (0, fs_1.unlinkSync)(this.filepath);
    }
    subscribe(query) {
        return __awaiter(this, void 0, void 0, function* () {
            if (query.type != 'fetch')
                throw new Errors_1.QueryError("Only Fetch Queries can be subscribed");
            this.subscriptions.push({ current: query.find(), query });
            if (this.subscriptions.length == 1) {
                // start watching the file
                (0, fs_1.watchFile)(this.filepath, { interval: 1000 }, () => {
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
        // We need two cases here:
        // 1. We are given an array of schemas with a directory
        // 2. We are given a directory with no schemas
        // all others throw an error
        if (!((_a = options === null || options === void 0 ? void 0 : options.schemas) === null || _a === void 0 ? void 0 : _a.length) && !(options === null || options === void 0 ? void 0 : options.directory))
            throw new Error("No schemas or directory provided");
        if (!(options === null || options === void 0 ? void 0 : options.directory))
            throw new Error("No directory provided");
        this.directory = options.directory;
        // create the directory if it doesn't exist
        if (!(0, fs_1.existsSync)(this.directory))
            (0, fs_1.mkdirSync)(this.directory);
        // get all files in directory
        const files = (0, fs_1.readdirSync)(options.directory);
        // check if the name matches pattern /*_table.json/
        const TableFiles = files.filter((file) => file.match(/.*_table.json/));
        if (TableFiles.length > 0) {
            const schemas = files.filter((file) => {
                return file.match(/.*_table.json/);
            }).map((file) => {
                const filepath = path.resolve(options.directory, file);
                const data = JSON.parse((0, fs_1.readFileSync)(filepath, "utf-8"));
                const schema = data.schema;
                return [schema, filepath];
            });
            schemas.forEach((data) => {
                this.tables.set(data[0].name, new Table(data[0], data[1]));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGIuanMiLCJzb3VyY2VSb290IjoiLi4vc3JjLyIsInNvdXJjZXMiOlsiRGIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsbUNBQWdDO0FBQ2hDLG1DQUE2QztBQUM3QyxxQ0FBcUQ7QUFDckQscUNBQXFDO0FBQ3JDLCtDQVEwQztBQUMxQywyQkFBNEc7QUFDNUcsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBbUM3QixNQUFhLEtBQUs7SUFNZCxZQUE2QixNQUFtQixFQUFVLFFBQWdCO1FBQTdDLFdBQU0sR0FBTixNQUFNLENBQWE7UUFBVSxhQUFRLEdBQVIsUUFBUSxDQUFRO1FBTGxFLFdBQU0sR0FBVSxJQUFJLGFBQUssRUFBRSxDQUFDO1FBRzVCLFlBQU8sR0FBWSxLQUFLLENBQUM7UUFDakMsa0JBQWEsR0FBMkMsRUFBRSxDQUFDO1FBRXZELElBQUcsQ0FBQyxDQUFDLFNBQVMsSUFBSSxNQUFNLENBQUM7WUFBRSxNQUFNLElBQUksc0JBQWEsQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFBO1FBQzNGLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQztRQUN4QixJQUFHLENBQUMsSUFBQSxlQUFVLEVBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQzNCLGFBQWE7WUFDYixJQUFBLGtCQUFhLEVBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUN4QyxNQUFNO2dCQUNOLGFBQWEsRUFBRSxDQUFDO2dCQUNoQixZQUFZLEVBQUUsQ0FBQztnQkFDZixJQUFJLEVBQUUsRUFBRTthQUNYLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDaEI7UUFDRCxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUM7SUFDbEMsQ0FBQztJQUNLLE1BQU0sQ0FBQyxJQUF5Qjs7WUFDbEMsSUFBRyxJQUFJLENBQUMsT0FBTztn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