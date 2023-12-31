/* tslint:disable */
import { expect } from 'chai';
import * as chai from 'chai'
import { it } from 'mocha';
chai.use(require('chai-as-promised'))
import path from 'path';
import { RDatabase, TableSchema } from '../Db';
import { ValidateEmail, ValidateISODate, ValidateURL, ValidationType } from '../Validations';
import { Operators, Query } from '../Query';

const testsPath = path.resolve(__dirname, '../tests' );
let database:any;
const usersSchema:TableSchema = {
    name: 'users',
    columns: [
        {
            name: 'id',
            type: ValidationType.NUMBER,
            unique: true,
            autoIncrement: true
        },
        {
            name: 'name',
            type: ValidationType.STRING,
            unique: true,
            minimum: 3,
            maximum: 30
        },
        {
            name: 'age',
            type: ValidationType.NUMBER
        },
        {
            name: 'email',
            type: ValidationType.EMAIL,
            unique: true
        },
        {
            name: 'password',
            type: ValidationType.STRING
        },
        {
            name: 'createdAt',
            type: ValidationType.DATE
        },
        {
            name: 'updatedAt',
            type: ValidationType.DATE
        }
    ]
}
describe('Create Database', () => {
    after(() => {
        database.drop('users');
        expect(database.tables.has('users')).to.be.false;
    });
    it('create database instance', () => {
        database = new RDatabase({
            directory: testsPath
        });
        expect(database).to.be.an.instanceOf(RDatabase);
    });
    it('drop users', async function(){
        if(database.tables.has('users')){
            database.drop('users');
            expect(database.tables.has('users')).to.be.false;
        } else {
            this.skip();
        }
    });
    it('create tables', async function(){
        if(!database.tables.has('users')){
            await database.create([usersSchema]);
            expect(database.tables.has('users')).to.be.true;
        } else {
            this.skip();
        }
    });
    it('add user', async function(){
        if(database.tables.has('users')){
            const u = database.tables.get('users');
            const userQuery =new Query(u);
            userQuery.insert({
                name: 'test',
                age: 20,
                email: 'test@test.com',
                password: 'password1234'
            });
            const result = await userQuery.execute();
            expect(result.length).to.equal(1);
        } else {
            this.skip();
        }
    });
    it('add user with malformed data', async function(){
        if(database.tables.has('users')){
            const u = database.tables.get('users');
            const userQuery =new Query(u);
            userQuery.insert({
                name: 'test6',
                age: '20',
                email: 'test@test.com',
                password: 'password1234'
            });
            expect(userQuery.execute).to.throw;
        } else {
            this.skip();
        }
    });
    it('add user with missing data',async function(){
        if(database.tables.has('users')){
            const u = database.tables.get('users');
            const userQuery =new Query(u);
            userQuery.insert({
                name: 'test5',
                age: '20',
                email: 'test@test.com',
            });
            expect(userQuery.execute).to.throw;
        } else {
            this.skip();
        }
    })
    it('add user with extra data', async function(){
        if(database.tables.has('users')){
            const u = database.tables.get('users');
            const userQuery =new Query(u);
            userQuery.insert({
                name: 'test4',
                age: '20',
                email: 'test4@test.com',
                password: 'password1234',
                extra: 'extra'
            });
            expect(userQuery.execute).to.throw;
        } else {
            this.skip();
        }
    })
    it('add user with invalid email type', async function(){
        if(database.tables.has('users')){
            const u = database.tables.get('users');
            const userQuery =new Query(u);
            userQuery.insert({
                name: 'test3',
                age: '20',
                email: 'test@test',
                password: 'password1234',
            });

            expect(userQuery.execute).to.throw;
        } else {
            this.skip();
        }
    })
    it('add user with invalid number type', async function(){
        if(database.tables.has('users')){
            const u = database.tables.get('users');
            const userQuery =new Query(u);
            userQuery.insert({
                name: 'test2',
                age: 20,
                email: 'test2@test.com',
                password: 'password1234',
            });
            const results = await userQuery.execute();
            expect(results).to.be.an('array');
            expect(results).to.have.a.lengthOf(1);
        } else {
            this.skip();
        }
    })
    it('add user with invalid string type', async function(){
        if(database.tables.has('users')){
            const u = database.tables.get('users');
            const userQuery =new Query(u);
            userQuery.insert({
                name: 4,
                age: '20',
                email: 'test@test',
                password: 'password1234',
            });
            // const records = await userQuery.execute();
            await expect(userQuery.execute).to.be.rejectedWith(Error)
        } else {
            this.skip();
        }
    })
    it('add user with invalid date type')
    it('add user with invalid boolean type')
    it('add user with invalid array type')
    it( 'updates record');
    it( 'updates record with malformed data');
    it( 'deletes record', async function(){
        if(database.tables.has('users')){
            const u = database.tables.get('users');
            const userQuery =new Query(u);
            const prior = u.data.length;
            userQuery.where({
                column: 'name',
                op: Operators.EQ,
                value: 'test'
            });
            const records = await userQuery.delete().execute();
            if(records.length !== 1) throw new Error("deletion .execute() returned no records");
            expect( prior - u.data.length ).to.equal(1);
        } else {
            this.skip();
        }
    })
    // q: what other tests should I write?
    // a: write tests for all the query methods
    // a: write tests for all the query events
    // a: write tests for all the query types
    // a: write tests for all the query operators
    // a: write tests for all the query rulesets
    // a: write tests for all the query rules
    // a: write tests for all the query sorting
    // a: write tests for all the query subscriptions
})
describe('Validations', () => {
    describe('ValidateEmail', () => {
        it('should validate test@email.com', ()=>{
            expect(ValidateEmail('test@email.com')).to.be.true;
        })
        it('Should throw on string \'test\'', () => {
            expect(ValidateEmail('test')).to.be.false;
        })
        it("test-email@email.com", () => {
            expect(ValidateEmail('test-email@email.com')).to.be.true;
        })
        it("test.email@email.com", () => {
            expect(ValidateEmail('test.email@email.com')).to.be.true;
        })
        it("test123email@email.com", () => {
            expect(ValidateEmail('test123email@email.com')).to.be.true;
        })
        it("test.emailemail.com", () => {
            expect(ValidateEmail('test.emailemail.com')).to.be.false;
        })
        it("test(io\"epam)example]com", () => {
            expect(ValidateEmail('test(io"epam)example]com')).to.be.false;
        })
        it("test+email@email.com", () => {
            expect(ValidateEmail('test+email@email.com')).to.be.false;
        })
    })
    describe('ValidateURL', () => {
        it('should validate https://www.google.com', ()=>{
            expect(ValidateURL('https://www.google.com')).to.be.true;
        })
        it('should validate http://www.google.com', ()=>{
            expect(ValidateURL('http://www.google.com')).to.be.true;
        })
        it('should not validate www.google.com', ()=>{
            expect(ValidateURL('www.google.com')).to.be.false;
        })
        it('should not validate google.com', ()=>{
            expect(ValidateURL('google.com')).to.be.false;
        })
    })
    describe('ValidateISODate', () => {
        it('should validate 2021-01-01T00:00:00.000Z', ()=>{
            expect(ValidateISODate('2021-01-01T00:00:00.000Z')).to.be.true;
        })
        it('should not validate 2021-01-01', ()=>{
            expect(ValidateISODate('2021-01-01')).to.be.false;
        })
    })
})