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
// write tests here
const chai_1 = require("chai");
const mocha_1 = require("mocha");
const path_1 = __importDefault(require("path"));
const Db_1 = require("../Db");
const Validations_1 = require("../Validations");
const Query_1 = require("../Query");
const testsPath = path_1.default.resolve(__dirname, '../tests');
let database;
const usersSchema = {
    name: 'users',
    columns: [
        {
            name: 'id',
            type: Validations_1.ValidationType.NUMBER,
            unique: true,
            autoIncrement: true
        },
        {
            name: 'name',
            type: Validations_1.ValidationType.STRING,
            unique: true,
            minimum: 3,
            maximum: 30
        },
        {
            name: 'age',
            type: Validations_1.ValidationType.NUMBER
        },
        {
            name: 'email',
            type: Validations_1.ValidationType.EMAIL,
            unique: true
        },
        {
            name: 'password',
            type: Validations_1.ValidationType.STRING
        },
        {
            name: 'createdAt',
            type: Validations_1.ValidationType.DATE
        },
        {
            name: 'updatedAt',
            type: Validations_1.ValidationType.DATE
        }
    ]
};
describe('Create Database', () => {
    after(() => {
        database.drop('users');
        (0, chai_1.expect)(database.tables.has('users')).to.be.false;
    });
    (0, mocha_1.it)('create database instance', () => {
        database = new Db_1.RDatabase({
            directory: testsPath
        });
        (0, chai_1.expect)(database).to.be.an.instanceOf(Db_1.RDatabase);
    });
    (0, mocha_1.it)('drop users', function () {
        return __awaiter(this, void 0, void 0, function* () {
            if (database.tables.has('users')) {
                database.drop('users');
                (0, chai_1.expect)(database.tables.has('users')).to.be.false;
            }
            else {
                this.skip();
            }
        });
    });
    (0, mocha_1.it)('create tables', function () {
        return __awaiter(this, void 0, void 0, function* () {
            if (!database.tables.has('users')) {
                yield database.create([usersSchema]);
                (0, chai_1.expect)(database.tables.has('users')).to.be.true;
            }
            else {
                this.skip();
            }
        });
    });
    (0, mocha_1.it)('add user', function () {
        return __awaiter(this, void 0, void 0, function* () {
            if (database.tables.has('users')) {
                const u = database.tables.get('users');
                const userQuery = new Query_1.Query(u);
                userQuery.insert({
                    name: 'test',
                    age: 20,
                    email: 'test@test.com',
                    password: 'password1234'
                });
                yield userQuery.execute();
                (0, chai_1.expect)(u.data.length).to.equal(1);
            }
            else {
                this.skip();
            }
        });
    });
    (0, mocha_1.it)('add user with malformed data', function () {
        return __awaiter(this, void 0, void 0, function* () {
            if (database.tables.has('users')) {
                const u = database.tables.get('users');
                const userQuery = new Query_1.Query(u);
                userQuery.insert({
                    name: 'test',
                    age: '20',
                    email: 'test@test.com',
                    password: 'password1234'
                });
                (0, chai_1.expect)(userQuery.execute).to.throw;
            }
            else {
                this.skip();
            }
        });
    });
    (0, mocha_1.it)('add user with missing data');
    (0, mocha_1.it)('add user with extra data');
    (0, mocha_1.it)('add user with invalid email type');
    (0, mocha_1.it)('add user with invalid number type');
    (0, mocha_1.it)('add user with invalid string type');
    (0, mocha_1.it)('add user with invalid date type');
    (0, mocha_1.it)('add user with invalid boolean type');
    (0, mocha_1.it)('add user with invalid array type');
    (0, mocha_1.it)('updates record');
    (0, mocha_1.it)('updates record with malformed data');
    (0, mocha_1.it)('deletes record');
    // q: what other tests should I write?
    // a: write tests for all the validations
    // a: write tests for all the query methods
    // a: write tests for all the query events
    // a: write tests for all the query types
    // a: write tests for all the query operators
    // a: write tests for all the query rulesets
    // a: write tests for all the query rules
    // a: write tests for all the query sorting
    // a: write tests for all the query pagination
    // a: write tests for all the query subscriptions
});
describe('Validations', () => {
    describe('ValidateEmail', () => {
        (0, mocha_1.it)('should validate test@email.com', () => {
            (0, chai_1.expect)((0, Validations_1.ValidateEmail)('test@email.com')).to.be.true;
        });
        (0, mocha_1.it)('Should throw on string \'test\'', () => {
            (0, chai_1.expect)((0, Validations_1.ValidateEmail)('test')).to.be.false;
        });
        (0, mocha_1.it)("test-email@email.com", () => {
            (0, chai_1.expect)((0, Validations_1.ValidateEmail)('test-email@email.com')).to.be.true;
        });
        (0, mocha_1.it)("test.email@email.com", () => {
            (0, chai_1.expect)((0, Validations_1.ValidateEmail)('test.email@email.com')).to.be.true;
        });
        (0, mocha_1.it)("test123email@email.com", () => {
            (0, chai_1.expect)((0, Validations_1.ValidateEmail)('test123email@email.com')).to.be.true;
        });
        (0, mocha_1.it)("test.emailemail.com", () => {
            (0, chai_1.expect)((0, Validations_1.ValidateEmail)('test.emailemail.com')).to.be.false;
        });
        (0, mocha_1.it)("test(io\"epam)example]com", () => {
            (0, chai_1.expect)((0, Validations_1.ValidateEmail)('test(io"epam)example]com')).to.be.false;
        });
        (0, mocha_1.it)("test+email@email.com", () => {
            (0, chai_1.expect)((0, Validations_1.ValidateEmail)('test+email@email.com')).to.be.false;
        });
    });
    describe('ValidateURL', () => {
        (0, mocha_1.it)('should validate https://www.google.com', () => {
            (0, chai_1.expect)((0, Validations_1.ValidateURL)('https://www.google.com')).to.be.true;
        });
        (0, mocha_1.it)('should validate http://www.google.com', () => {
            (0, chai_1.expect)((0, Validations_1.ValidateURL)('http://www.google.com')).to.be.true;
        });
        (0, mocha_1.it)('should not validate www.google.com', () => {
            (0, chai_1.expect)((0, Validations_1.ValidateURL)('www.google.com')).to.be.false;
        });
        (0, mocha_1.it)('should not validate google.com', () => {
            (0, chai_1.expect)((0, Validations_1.ValidateURL)('google.com')).to.be.false;
        });
    });
    describe('ValidateISODate', () => {
        (0, mocha_1.it)('should validate 2021-01-01T00:00:00.000Z', () => {
            (0, chai_1.expect)((0, Validations_1.ValidateISODate)('2021-01-01T00:00:00.000Z')).to.be.true;
        });
        (0, mocha_1.it)('should not validate 2021-01-01', () => {
            (0, chai_1.expect)((0, Validations_1.ValidateISODate)('2021-01-01')).to.be.false;
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGVzdC5qcyIsInNvdXJjZVJvb3QiOiIuLi9zcmMvIiwic291cmNlcyI6WyJ0ZXN0cy9UZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQUEsbUJBQW1CO0FBQ25CLCtCQUE4QjtBQUM5QixpQ0FBMkI7QUFDM0IsZ0RBQXdCO0FBQ3hCLDhCQUErQztBQUMvQyxnREFBNkY7QUFDN0Ysb0NBQWlDO0FBRWpDLE1BQU0sU0FBUyxHQUFHLGNBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBRSxDQUFDO0FBQ3ZELElBQUksUUFBWSxDQUFDO0FBQ2pCLE1BQU0sV0FBVyxHQUFlO0lBQzVCLElBQUksRUFBRSxPQUFPO0lBQ2IsT0FBTyxFQUFFO1FBQ0w7WUFDSSxJQUFJLEVBQUUsSUFBSTtZQUNWLElBQUksRUFBRSw0QkFBYyxDQUFDLE1BQU07WUFDM0IsTUFBTSxFQUFFLElBQUk7WUFDWixhQUFhLEVBQUUsSUFBSTtTQUN0QjtRQUNEO1lBQ0ksSUFBSSxFQUFFLE1BQU07WUFDWixJQUFJLEVBQUUsNEJBQWMsQ0FBQyxNQUFNO1lBQzNCLE1BQU0sRUFBRSxJQUFJO1lBQ1osT0FBTyxFQUFFLENBQUM7WUFDVixPQUFPLEVBQUUsRUFBRTtTQUNkO1FBQ0Q7WUFDSSxJQUFJLEVBQUUsS0FBSztZQUNYLElBQUksRUFBRSw0QkFBYyxDQUFDLE1BQU07U0FDOUI7UUFDRDtZQUNJLElBQUksRUFBRSxPQUFPO1lBQ2IsSUFBSSxFQUFFLDRCQUFjLENBQUMsS0FBSztZQUMxQixNQUFNLEVBQUUsSUFBSTtTQUNmO1FBQ0Q7WUFDSSxJQUFJLEVBQUUsVUFBVTtZQUNoQixJQUFJLEVBQUUsNEJBQWMsQ0FBQyxNQUFNO1NBQzlCO1FBQ0Q7WUFDSSxJQUFJLEVBQUUsV0FBVztZQUNqQixJQUFJLEVBQUUsNEJBQWMsQ0FBQyxJQUFJO1NBQzVCO1FBQ0Q7WUFDSSxJQUFJLEVBQUUsV0FBVztZQUNqQixJQUFJLEVBQUUsNEJBQWMsQ0FBQyxJ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