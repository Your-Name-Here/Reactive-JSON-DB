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
    }
    get id() {
        return this.get('id');
    }
    get hash() {
        const dataString = JSON.stringify(this.toJSON());
        const sha256Hash = crypto.createHash('sha256').update(dataString).digest('hex');
        return sha256Hash;
    }
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
    subscribe(fn) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = new Query_1.Query(this.table);
            query.andWhere({
                column: "id",
                op: Query_1.Operators.EQ,
                value: this.id,
            });
            query.on('removed', fn);
            return yield this.table.subscribe(query);
        });
    }
    // I would like to add a way to set the value of a column and then have it automatically save to the database but I'm not sure how to do that because the set method is already taken
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmVjb3JkLmpzIiwic291cmNlUm9vdCI6Ii4uL3NyYy8iLCJzb3VyY2VzIjpbIlJlY29yZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLHFDQUFzQztBQUN0QyxtQ0FBMkM7QUFDM0MsK0NBQWlDO0FBQ2pDLDRDQUFvQjtBQUVwQixNQUFhLFNBQVUsU0FBUSxHQUFnQjtJQUMzQyxZQUFZLElBQWdCLEVBQVUsS0FBWTtRQUM5QyxLQUFLLEVBQUUsQ0FBQztRQUQwQixVQUFLLEdBQUwsS0FBSyxDQUFPO1FBRTlDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDL0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDL0IsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBQ0QsSUFBSSxFQUFFO1FBQ0YsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFDRCxJQUFJLElBQUk7UUFDSixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ2pELE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoRixPQUFPLFVBQVUsQ0FBQztJQUN0QixDQUFDO0lBQ0QsSUFBSTtRQUNBLE1BQU0sSUFBSSxHQUFHLFlBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDM0QsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMs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