import { RDatabase, TableSchema } from "./Db";
import { FetchQuery, Operators, Query } from "./Query";
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
let unsubscribe;
// const db = database.create([
//     userSchema,
//     postsSchema
// ]);
// console.log("Finding the Admins...");
// const query = new FetchQuery({
//     value: 'gmail.com',
//     op: Operators.IN,
//     column: "email",
// });
const users = database.tables.get('users');
// const oldPeople = new Query(users)
// .where({
//     column: "age",
//     op: Operators.GT,
//     value: 30,
// })
// .orderBy("age", "ASC")
// .subscribe((updates) => {
//     updates.added.forEach((user) => {
//         console.log(`New User: ${user.get('name')}`);
//     });
//     updates.removed.forEach((user) => {
//         console.log(`User Removed: ${user.get('name')}`);
//     });
//     updates.updated.forEach((user) => {
//         console.log(`Update to User: ${user.get('name')}`);
//     });
// });
const regularUsers = new Query(users)
.where({
    column: "isAdmin",
    op: Operators.EQ,
    value: false,
});
regularUsers.subscribe((updates) => {
    // const _users = regularUsers.find();
    // updates.added.forEach((user) => {
    //     console.log(`New User: ${user.get('name')}`);
    // });
    // updates.removed.forEach((user) => {
    //     console.log(`User Removed: ${user.get('name')}`);
    // });
    // updates.updated.forEach((user) => {
    //     console.log(`Update to User: ${user.get('name')}`);
    // });
    // console.log("Regular Users:", _users.map((user) => user.get('name')).join(", "));
});
const adminsQuery = new Query(users)
.where({
    column: "isAdmin",
    op: Operators.EQ,
    value: true,
});
const admins = adminsQuery.find();
const regUsers = regularUsers.find();
console.log("Admins:", admins.map((user) => user.get('name')).join(", "));
console.log("Regular Users:", regUsers.map((user) => user.get('name')).join(", "));
adminsQuery.subscribe(updates=>{
    const _admins = adminsQuery.find();
    if(updates.added.length > 0) {
        // console.log("New Admins Added");
        console.log(updates.added.length, "New admins:", updates.added.map((user) => user.get('name')).join(", "));
    }
    else if(updates.removed.length > 0) {
        // console.log("Admins Removed");
        console.log(updates.removed.length, "Admins removed", updates.removed.map((user) => user.get('name')).join(", "));
    }
    else if(updates.updated.length > 0) {
        // console.log("Admins Updated");
        console.log(updates.updated.length, "Admins Updated", updates.updated.map((user) => user.get('name')).join(", "));
    }
    const _users = regularUsers.find();
    console.clear();
    console.log('Admins');
    _admins.forEach((user) => {
        console.log('    -',user.get('name'));
        // console.log("Admins:", _admins.map((user) => user.get('name')+' ('+user.get('email')+')').join(", "));
    });
    console.log("Regular Users:", _users.map((user) => user.get('name')).join(", "));
})
