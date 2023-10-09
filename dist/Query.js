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
        this.table = table;
    }
    find() {
        const raw = this.table.data.filter((item) => this.satisfiesRuleset(item, this.query));
        if (this._limit) {
            return raw.sort(this.sortingFn).slice(0, this._limit);
        }
        return raw.sort(this.sortingFn);
    }
    where(rule) {
        this.orWhere(rule);
        return this;
    }
    andWhere(rule) {
        if (this.query.and == undefined)
            this.query.and = [rule];
        else
            this.query.and.push(rule);
        return this;
    }
    orWhere(rule) {
        if (this.query.or == undefined)
            this.query.or = [rule];
        else
            this.query.or.push(rule);
        return this;
    }
    set(columns) {
        this.type = 'update';
        return this;
    }
    insert(data) {
        this.type = 'insert';
        this.data = data;
        return this;
    }
    delete() {
        this.type = 'delete';
    }
    limit(limit) {
        this._limit = limit;
        return this;
    }
    /**
     * Subscribes to the query and returns an unsubscribe function
     * @param fn function to run when the data is changed
     * @returns promise - an unsubscribe function
     */
    subscribe() {
        return __awaiter(this, void 0, void 0, function* () {
            // throw new QueryError("Not Implemented");
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
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            // throw new QueryError("Not Implemented");
            if (this.type == 'fetch')
                return this.find();
            if (this.type == 'insert') {
                if (this.data)
                    return yield this.table.insert(this.data);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUXVlcnkuanMiLCJzb3VyY2VSb290IjoiLi4vc3JjLyIsInNvdXJjZXMiOlsiUXVlcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEscUNBQXNDO0FBR3RDLG9EQUFrQztBQUVsQyxJQUFZLFNBYVg7QUFiRCxXQUFZLFNBQVM7SUFDakIscUJBQVEsQ0FBQTtJQUNSLHNCQUFTLENBQUE7SUFDVCxxQkFBUSxDQUFBO0lBQ1IsdUJBQVUsQ0FBQTtJQUNWLHFCQUFRLENBQUE7SUFDUix1QkFBVSxDQUFBO0lBQ1Ysc0JBQVMsQ0FBQTtJQUNULHdCQUFXLENBQUE7SUFDWCx3QkFBVyxDQUFBO0lBQ1gsc0JBQVMsQ0FBQTtJQUNULHdCQUFXLENBQUE7SUFDWCw0QkFBZSxDQUFBO0FBQ25CLENBQUMsRUFiVyxTQUFTLHlCQUFULFNBQVMsUUFhcEI7QUFPRCxNQUFhLEtBQU0sU0FBUSxnQkFBWTtJQU9uQyxZQUFvQixLQUFZO1FBQzVCLEtBQUssRUFBRSxDQUFBO1FBRFMsVUFBSyxHQUFMLEtBQUssQ0FBTztRQU5oQyxVQUFLLEdBQVksRUFBRyxDQUFDO1FBQ2IsV0FBTSxHQUFnQixJQUFJLENBQUM7UUFDM0IsY0FBUyxHQUEyQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN4RSxTQUFJLEdBQXVDLE9BQU8sQ0FBQztRQUsvQyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztJQUN2QixDQUFDO0lBQ00sSUFBSTtRQUNQLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUN0RixJQUFHLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDWixPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFB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