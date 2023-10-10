"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RDBRecord = void 0;
const events_1 = __importDefault(require("events"));
const Errors_1 = require("./Errors");
const Query_1 = require("./Query");
const crypto = __importStar(require("crypto"));
const fs_1 = __importDefault(require("fs"));
class RDBRecord extends Map {
    constructor(data, table) {
        super();
        this.table = table;
        Object.keys(data).forEach((item) => {
            this.set(item, data[item]);
        });
        this.events = new events_1.default();
        if (!this.has('createdAt'))
            this.set('createdAt', Date.now().toString());
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
    get hash() {
        const dataString = JSON.stringify(this.toJSON());
        const sha256Hash = crypto.createHash('sha256').update(dataString).digest('hex');
        return sha256Hash;
    }
    /**
     * Saves the record to the database after updating the data
     */
    save() {
        const file = fs_1.default.readFileSync(this.table.filePath, "utf-8");
        const parsed = JSON.parse(file);
        const index = parsed.data.findIndex((item) => item.id === this.id);
        if (JSON.stringify(this) == JSON.stringify(parsed.data[index]))
            return false;
        parsed.data[index] = this.toJSON();
        parsed.data[index].updatedAt = new Date().toISOString();
        fs_1.default.writeFileSync(this.table.filePath, JSON.stringify(parsed, null, 2));
        return true;
    }
    /**
     * Removes the record from the database
     */
    remove() {
        return __awaiter(this, void 0, void 0, function* () {
            const file = fs_1.default.readFileSync(this.table.filePath, "utf-8");
            const parsed = JSON.parse(file);
            const index = parsed.data.findIndex((item) => item.id === this.id);
            parsed.data.splice(index, 1);
            fs_1.default.writeFileSync(this.table.filePath, JSON.stringify(parsed, null, 2));
            return true;
        });
    }
    /**
     * Subscribes to updates to the record
     */
    subscribe(fn) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = new Query_1.Query(this.table);
            query.andWhere({
                column: "id",
                op: Query_1.Operators.EQ,
                value: this.id,
            });
            query.on('removed', fn);
            query.on('updated', fn);
            yield this.table.subscribe(query);
            return () => {
                query.removeListener('removed', fn);
                query.removeListener('updated', fn);
            };
        });
    }
    /**
     * Updates the record with the new data. Autosaves by default.
     */
    update(column, value, autosave = true) {
        const col = this.table.columns.find((col) => col.name == column);
        if (!col)
            throw new Errors_1.QueryError(`Column '${column}' does not exist in table '${this.table.name}'`);
        // if(col.unique && await this.table.find((item) => item.get(column) == value)) throw new QueryError(`Value '${value}' is not unique for column '${column}'`
        if (this.table.validate(value, col)) {
            super.set(column, value);
            if (autosave)
                this.save();
        }
        else {
            throw new Errors_1.QueryError(`Value ${value} is not valid for column ${column}`);
        }
    }
    toJSON() {
        return Object.fromEntries(this.entries());
    }
    toString() {
        return JSON.stringify(Object.fromEntries(this.entries()));
    }
}
exports.RDBRecord = RDBRecord;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmVjb3JkLmpzIiwic291cmNlUm9vdCI6Ii4uL3NyYy8iLCJzb3VyY2VzIjpbIlJlY29yZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLG9EQUFrQztBQUVsQyxxQ0FBc0M7QUFDdEMsbUNBQTJDO0FBQzNDLCtDQUFpQztBQUNqQyw0Q0FBb0I7QUFFcEIsTUFBYSxTQUFVLFNBQVEsR0FBZ0I7SUFLM0MsWUFBWSxJQUFnQixFQUFVLEtBQVk7UUFDOUMsS0FBSyxFQUFFLENBQUM7UUFEMEIsVUFBSyxHQUFMLEtBQUssQ0FBTztRQUU5QyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFO1lBQy9CLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQy9CLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLGdCQUFZLEVBQUUsQ0FBQztRQUNqQyxJQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUM7WUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUN4RSxJQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUM3QyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUM7UUFDM0IsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNqQyxDQUFDO0lBQ0Qs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