import { RDatabase, TableSchema } from "./Db";
import { FetchQuery, Operators } from "./Query";

const userSchema: TableSchema = {
    name: "users",
    columns: [
        { name: 'id', type: "string" },
        { name: 'isAdmin', type: "boolean" },
        { name: 'name', type: "string", unique:true },
        { name: 'age', type: "number" },
        { name: 'email', type: "string", format: "email", unique: true, validationFn: (value) => {
            const regex = new RegExp(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/);
            return regex.test(value); 
        } },
        { name: 'password', type: "string" },
        { name: 'createdAt', type: "string", format: "date" },
        { name: 'updatedAt', type: "string", format: "date" },
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
console.log("Finding the Admins...");
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

// db.users.find(query).then((data) => {
//     if(data.length){
//         data.forEach((user) => {
//             console.log(`${user.get('name')} is ${user.get('age')}, god damn!`);
//         })
//     } else {
//         console.log("No old people found");
//     }
// }).catch(console.log);
let unsubscribe;
const users = database.tables.get('users');

users.subscribe(adminQuery, (newData, updates) => {
    // console.log("Resultset changed", updates);
    
    updates.added.forEach((user) => {
        console.log(`New Admin: ${user.get('name')}`);
    });
    updates.removed.forEach((user) => {
        console.log(`Admin Removed: ${user.get('name')}`);
    });
    updates.updated.forEach((user) => {
        console.log(`Update to Admin: ${user.get('name')}`);
    });
    // newData.forEach((user) => {
    //     console.log(`Admin: ${user.get('name')} is ${user.get('age')}`);
    // });
}).then(u=>unsubscribe = u).catch(console.log);
// db.users.insert({
//     id: "127",
//     isAdmin: false,
//     name: "Rebekah",
//     age: 34,
//     email: "bekah119a@gmail.com",
//     password: "password123",
//     createdAt: new Date().toISOString(),
//     updatedAt: new Date().toISOString(),
// }).catch(console.log);
database.tables.get('users').remove(new FetchQuery({
    value: "test",
    op: Operators.IN,
    column: "name",
})).then((success) => {
    console.log(`Records ${(success ? "removed" : "not removed")} successfully`);
}).catch(console.error);
// db.users.subscribe(query, (newData, updates) => {
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
//     console.timeEnd("Delay");
// }).then(u=>unsubscribe = u).catch(console.log);
// db.users.update(adminQuery, {
//     isAdmin: false
// }).then((data) => {});