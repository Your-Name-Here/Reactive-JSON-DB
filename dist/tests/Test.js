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
/* tslint:disable */
const chai_1 = require("chai");
const chai = __importStar(require("chai"));
const mocha_1 = require("mocha");
chai.use(require('chai-as-promised'));
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
                const result = yield userQuery.execute();
                (0, chai_1.expect)(result.length).to.equal(1);
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
                    name: 'test6',
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
    (0, mocha_1.it)('add user with missing data', function () {
        return __awaiter(this, void 0, void 0, function* () {
            if (database.tables.has('users')) {
                const u = database.tables.get('users');
                const userQuery = new Query_1.Query(u);
                userQuery.insert({
                    name: 'test5',
                    age: '20',
                    email: 'test@test.com',
                });
                (0, chai_1.expect)(userQuery.execute).to.throw;
            }
            else {
                this.skip();
            }
        });
    });
    (0, mocha_1.it)('add user with extra data', function () {
        return __awaiter(this, void 0, void 0, function* () {
            if (database.tables.has('users')) {
                const u = database.tables.get('users');
                const userQuery = new Query_1.Query(u);
                userQuery.insert({
                    name: 'test4',
                    age: '20',
                    email: 'test4@test.com',
                    password: 'password1234',
                    extra: 'extra'
                });
                (0, chai_1.expect)(userQuery.execute).to.throw;
            }
            else {
                this.skip();
            }
        });
    });
    (0, mocha_1.it)('add user with invalid email type', function () {
        return __awaiter(this, void 0, void 0, function* () {
            if (database.tables.has('users')) {
                const u = database.tables.get('users');
                const userQuery = new Query_1.Query(u);
                userQuery.insert({
                    name: 'test3',
                    age: '20',
                    email: 'test@test',
                    password: 'password1234',
                });
                (0, chai_1.expect)(userQuery.execute).to.throw;
            }
            else {
                this.skip();
            }
        });
    });
    (0, mocha_1.it)('add user with invalid number type', function () {
        return __awaiter(this, void 0, void 0, function* () {
            if (database.tables.has('users')) {
                const u = database.tables.get('users');
                const userQuery = new Query_1.Query(u);
                userQuery.insert({
                    name: 'test2',
                    age: 20,
                    email: 'test2@test.com',
                    password: 'password1234',
                });
                const results = yield userQuery.execute();
                (0, chai_1.expect)(results).to.be.an('array');
                (0, chai_1.expect)(results).to.have.a.lengthOf(1);
            }
            else {
                this.skip();
            }
        });
    });
    (0, mocha_1.it)('add user with invalid string type', function () {
        return __awaiter(this, void 0, void 0, function* () {
            if (database.tables.has('users')) {
                const u = database.tables.get('users');
                const userQuery = new Query_1.Query(u);
                userQuery.insert({
                    name: 4,
                    age: '20',
                    email: 'test@test',
                    password: 'password1234',
                });
                // const records = await userQuery.execute();
                yield (0, chai_1.expect)(userQuery.execute).to.be.rejectedWith(Error);
            }
            else {
                this.skip();
            }
        });
    });
    (0, mocha_1.it)('add user with invalid date type');
    (0, mocha_1.it)('add user with invalid boolean type');
    (0, mocha_1.it)('add user with invalid array type');
    (0, mocha_1.it)('updates record');
    (0, mocha_1.it)('updates record with malformed data');
    (0, mocha_1.it)('deletes record');
    // q: what other tests should I write?
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGVzdC5qcyIsInNvdXJjZVJvb3QiOiIuLi9zcmMvIiwic291cmNlcyI6WyJ0ZXN0cy9UZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxvQkFBb0I7QUFDcEIsK0JBQThCO0FBQzlCLDJDQUE0QjtBQUM1QixpQ0FBMkI7QUFDM0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFBO0FBQ3JDLGdEQUF3QjtBQUN4Qiw4QkFBK0M7QUFDL0MsZ0RBQTZGO0FBQzdGLG9DQUFpQztBQUVqQyxNQUFNLFNBQVMsR0FBRyxjQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUUsQ0FBQztBQUN2RCxJQUFJLFFBQVksQ0FBQztBQUNqQixNQUFNLFdBQVcsR0FBZTtJQUM1QixJQUFJLEVBQUUsT0FBTztJQUNiLE9BQU8sRUFBRTtRQUNMO1lBQ0ksSUFBSSxFQUFFLElBQUk7WUFDVixJQUFJLEVBQUUsNEJBQWMsQ0FBQyxNQUFNO1lBQzNCLE1BQU0sRUFBRSxJQUFJO1lBQ1osYUFBYSxFQUFFLElBQUk7U0FDdEI7UUFDRDtZQUNJLElBQUksRUFBRSxNQUFNO1lBQ1osSUFBSSxFQUFFLDRCQUFjLENBQUMsTUFBTTtZQUMzQixNQUFNLEVBQUUsSUFBSTtZQUNaLE9BQU8sRUFBRSxDQUFDO1lBQ1YsT0FBTyxFQUFFLEVBQUU7U0FDZDtRQUNEO1lBQ0ksSUFBSSxFQUFFLEtBQUs7WUFDWCxJQUFJLEVBQUUsNEJBQWMsQ0FBQyxNQUFNO1NBQzlCO1FBQ0Q7WUFDSSxJQUFJLEVBQUUsT0FBTztZQUNiLElBQUksRUFBRSw0QkFBYyxDQUFDLEtBQUs7WUFDMUIsTUFBTSxFQUFFLElBQUk7U0FDZjtRQUNEO1lBQ0ksSUFBSSxFQUFFLFVBQVU7WUFDaEIsSUFBSSxFQUFFLDRCQUFjLENBQUMsTUFBTTtTQUM5QjtRQUNEO1lBQ0ksSUFBSSxFQUFFLFdB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