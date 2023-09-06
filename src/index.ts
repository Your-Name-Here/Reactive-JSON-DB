import validation from "ajv/dist/vocabularies/validation";
import { RDatabase, TableSchema } from "./Db";
import { FetchQuery, Operators } from "./Query";
import { ValidationType } from "./Validations";

const userSchema: TableSchema = {
    name: "users",
    columns: [
        { name: 'id', type: ValidationType.STRING, unique: true, autoIncrement: true },
        { name: 'isAdmin', type: ValidationType.BOOLEAN, default: false },
        { name: 'name', type: ValidationType.STRING, unique:true, minimum: 3, maximum: 30 },
        { name: 'age', type: ValidationType.NUMBER },
        { name: 'email', type: ValidationType.EMAIL, unique: true },
        { name: 'password', type: ValidationType.STRING },
        { name: 'createdAt', type: ValidationType.DATE },
        { name: 'updatedAt', type: ValidationType.DATE },
    ]
}
const database = new RDatabase({
    // directory: "./dist/",
    schemas: [
        userSchema
    ]
});
// const db = database.create([
//     userSchema,
//     postsSchema
// ]);
// db.users.insert({
//     id: "124",
//     name: "Noah",
//     age: 35,
//     email: "archdeacon84@gmail.com",
//     password: "password123",
//     createdAt: new Date().toISOString(),
//     updatedAt: new Date().toISOString(),
// }).then((data) => {
//     console.log(data.id, 'inserted');
    
//     db.users.update(new FetchQuery({
//         column: "id",
//         op: Operators.EQ,
//         value: "123",
//     }), {
//         name: "test",
//     }).then((data) => {});

// }).catch(console.log);
// console.log("Finding the Admins...");
const query = new FetchQuery({
    value: 'gmail.com',
    op: Operators.IN,
    column: "email",
});
const query2 = new FetchQuery({
    value: '30',
    op: Operators.GT,
    column: "age",
});
const adminQuery = new FetchQuery({
    column: "isAdmin",
    op: Operators.EQ,
    value: true,
});
const nonAdminQuery = new FetchQuery({
    column: "isAdmin",
    op: Operators.EQ,
    value: false,
});

let unsubscribe;
const users = database.tables.get('users');
users.subscribe(query2, (updates) => {
    updates.added.forEach((user) => {
        console.log(`New Admin: ${user.get('name')}`);
    });
    updates.removed.forEach((user) => {
        console.log(`Admin Removed: ${user.get('name')}`);
    });
    updates.updated.forEach((user) => {
        console.log(`Update to Admin: ${user.get('name')}`);
    });
}).then(results=>{
    unsubscribe = results.unsubscribe;
    console.log("Subscribed to records that are older than 30:", results.records.length, 'records found');
}).catch(console.log);
// users.insert({
//     name: "Rebekah",
//     isAdmin: false,
//     age: 34,
//     email: "bekah119a@gmail.com",
//     password: "password123",
//     createdAt: new Date().toISOString(),
//     updatedAt: new Date().toISOString(),
// }).catch(error=>{
//     console.error('Failed to insert Rebekah: ', error.message);
// });
// database.tables.get('users').remove(new FetchQuery({
//     value: "test",
//     op: Operators.IN,
//     column: "name",
// })).then((success) => {
//     console.log(`Records ${(success ? "removed" : "not removed")} successfully`);
// }).catch(console.error);
// users.subscribe(query, (newData, updates) => {
//     // console.log("Resultset changed", updates);
    
//     updates.added.forEach((user) => {
//         console.log(`New old person: ${user.get('name')} is ${user.get('age')}`);
//     });
//     updates.removed.forEach((user) => {
//         console.log(`No longer old: ${user.get('name')}`);
//     });
//     updates.updated.forEach((user) => {
//         console.log(`Updated old person: ${user.get('name')} is ${user.get('age')}`);
//     });
// }).then(u=>unsubscribe = u).catch(console.log);
// db.users.update(adminQuery, {
//     isAdmin: false
// }).then((data) => {});