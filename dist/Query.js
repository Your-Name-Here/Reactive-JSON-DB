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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Query = exports.Operators = void 0;
const Errors_1 = require("./Errors");
const Record_1 = require("./Record");
const events_1 = __importDefault(require("events"));
var Operators;
(function (Operators) {
    Operators["EQ"] = "=";
    Operators["NE"] = "!=";
    Operators["GT"] = ">";
    Operators["GTE"] = ">=";
    Operators["LT"] = "<";
    Operators["LTE"] = "<=";
    Operators["IN"] = "in";
    Operators["NIN"] = "nin";
    Operators["AND"] = "and";
    Operators["OR"] = "or";
    Operators["NOT"] = "not";
    Operators["REGEX"] = "regex";
})(Operators || (exports.Operators = Operators = {}));
class Query extends events_1.default {
    constructor(table) {
        super();
        this.table = table;
        this.query = {};
        this._limit = null;
        this.sortingFn = (a, b) => 0;
        this.type = 'fetch';
        this.data = [];
        this.table = table;
    }
    /**
     * Returns the results of the query as an array of RDBRecords
     *
     * If no where clauses are added, returns all records in the table.
     */
    find() {
        if (this.query.and == undefined && this.query.or === undefined)
            return this.table.data.sort(this.sortingFn).slice(0, this._limit || undefined);
        const raw = this.table.data.filter((item) => this.satisfiesRuleset(item, this.query));
        if (this._limit) {
            return raw.sort(this.sortingFn).slice(0, this._limit);
        }
        return raw.sort(this.sortingFn);
    }
    /**
     * Adds a where clause to the query. Can be chained. eg. `query.where({ column: "id", op: Operators.EQ, value: 1 }).execute()`
     *
     * This is an alias for `query.orWhere()` so you can actually call this several times on a query to add multiple "or where" clauses.
     */
    where(rule) {
        this.orWhere(rule);
        return this;
    }
    /**
     * Adds an "and where" clause to the query. Can be chained. eg.
     *
     * `query.andWhere({ column: "name", op: Operators.EQ, value: 'John' }).andWhere({ value: 'gmail.com', op: Operators.IN, column: 'email' }).execute()`
     */
    andWhere(rule) {
        if (this.query.and == undefined)
            this.query.and = [rule];
        else
            this.query.and.push(rule);
        return this;
    }
    /**
     * Adds an "or where" clause to the query. Can be chained and called multiple times on the same query.
     */
    orWhere(rule) {
        if (this.query.or == undefined)
            this.query.or = [rule];
        else
            this.query.or.push(rule);
        return this;
    }
    /**
     * Transforms into an `Update` query and sets data to be updated. Need to call execute() to run the query after adding where clauses.
     * Can be chained. eg. `query.update([{ name: "John Doe" }]).where({ column: "id", op: Operators.EQ, value: 1 }).execute()`
     */
    set(columns) {
        this.type = 'update';
        for (const record of this.data) {
            for (const column of columns) {
                record.set(column.name, column.value);
            }
        }
        return this;
    }
    /**
     * Transforms this query into an insert query. Need to call execute() to run the query after adding where clauses.
     * Can be chained. eg. `query.insert({ name: "John Doe" }).execute()`
     */
    insert(data) {
        this.type = 'insert';
        if (data instanceof Record_1.RDBRecord)
            this.data.push(data);
        else
            this.data.push(new Record_1.RDBRecord(data, this.table));
        return this;
    }
    /**
     * Transforms this query into a delete query. Need to call execute() to run the query after adding where clauses.
     * Can be chained. eg. `query.delete().where({ column: "id", op: Operators.EQ, value: 1 }).execute()`
     */
    delete() {
        this.type = 'delete';
        return this;
    }
    /**
     * Limit the operation to a certain number of records.
     */
    limit(limit) {
        this._limit = limit;
        return this;
    }
    /**
     * Subscribes to the query and returns an unsubscribe function
     * @param fn function to run when the data is changed
     * @returns promise - an unsubscribe function
     * @todo implement unsubscribe
     */
    subscribe() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.type != 'fetch')
                throw new Errors_1.QueryError(`Only fetch queries can be subscribed to. This query type: '${this.type}'.`);
            this.table.subscribe(this);
        });
    }
    orderBy(column, direction) {
        if (direction == 'ASC')
            this.sortingFn = (a, b) => a.get(column) - b.get(column);
        else
            this.sortingFn = (a, b) => b.get(column) - a.get(column);
        return this;
    }
    satisfiesRule(item, rule) {
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
    satisfiesRuleset(item, ruleset) {
        var _a, _b;
        let satisfiesAnd = true;
        let satisfiesOr = true;
        if ('and' in ruleset) {
            satisfiesAnd = ((_a = ruleset.and) !== null && _a !== void 0 ? _a : []).every((rule) => this.satisfiesRule(item, rule));
        }
        if ('or' in ruleset) {
            satisfiesOr = ((_b = ruleset.or) !== null && _b !== void 0 ? _b : []).some((rule) => this.satisfiesRule(item, rule));
        }
        return satisfiesAnd && satisfiesOr;
    }
    ;
    /**
     * Executes the query and returns the result.
     * @todo implement update and delete queries
     */
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.type == 'fetch')
                return this.find();
            if (this.type == 'insert') {
                const ret = [];
                if (this.data.length) {
                    for (const record of this.data) {
                        yield this.table.insert(record);
                        ret.push(record);
                    }
                    return ret;
                }
                else
                    throw new Errors_1.QueryError("No data to insert");
            }
            if (this.type == 'update') {
                throw new Errors_1.QueryError("Update Not Implemented");
            }
            if (this.type == 'delete') {
                throw new Errors_1.QueryError("Delete Not Implemented");
            }
            return [];
        });
    }
}
exports.Query = Query;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUXVlcnkuanMiLCJzb3VyY2VSb290IjoiLi4vc3JjLyIsInNvdXJjZXMiOlsiUXVlcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEscUNBQXNDO0FBQ3RDLHFDQUFxQztBQUVyQyxvREFBa0M7QUFFbEMsSUFBWSxTQWFYO0FBYkQsV0FBWSxTQUFTO0lBQ2pCLHFCQUFRLENBQUE7SUFDUixzQkFBUyxDQUFBO0lBQ1QscUJBQVEsQ0FBQTtJQUNSLHVCQUFVLENBQUE7SUFDVixxQkFBUSxDQUFBO0lBQ1IsdUJBQVUsQ0FBQTtJQUNWLHNCQUFTLENBQUE7SUFDVCx3QkFBVyxDQUFBO0lBQ1gsd0JBQVcsQ0FBQTtJQUNYLHNCQUFTLENBQUE7SUFDVCx3QkFBVyxDQUFBO0lBQ1gsNEJBQWUsQ0FBQTtBQUNuQixDQUFDLEVBYlcsU0FBUyx5QkFBVCxTQUFTLFFBYXBCO0FBT0QsTUFBYSxLQUFNLFNBQVEsZ0JBQVk7SUFPbkMsWUFBb0IsS0FBWTtRQUM1QixLQUFLLEVBQUUsQ0FBQTtRQURTLFVBQUssR0FBTCxLQUFLLENBQU87UUFOaEMsVUFBSyxHQUFZLEVBQUcsQ0FBQztRQUNiLFdBQU0sR0FBZ0IsSUFBSSxDQUFDO1FBQzNCLGNBQVMsR0FBMkMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDeEUsU0FBSSxHQUF1QyxPQUFPLENBQUM7UUFDbkQsU0FBSSxHQUFjLEVBQUUsQ0FBQztRQUlqQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztJQUN2QixDQUFDO0lBQ0Q7Ozs7T0FJRztJQUNJLElBQUk7UUFDUCxJQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLFNBQVMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxTQUFTO1lBQUUsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFD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