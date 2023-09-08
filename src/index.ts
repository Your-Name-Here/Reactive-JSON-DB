import path, { dirname } from "path";
import { RDatabase, TableSchema } from "./Db";
import { Operators, Query } from "./Query";
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
const commentsSchema: TableSchema = {
    name: "comments",
    columns: [
        { name: 'id', type: ValidationType.NUMBER, unique: true, autoIncrement: true },
        { name: 'userId', type: ValidationType.NUMBER, required: true },
        { name: 'content', type: ValidationType.STRING, required: true },
        { name: 'createdAt', type: ValidationType.DATE },
        { name: 'updatedAt', type: ValidationType.DATE },
    ]
}
const database = new RDatabase({
    directory: path.resolve( __dirname ,'..', "dist"),
});
if(!database.tables.has('users')) {
    database.create([
        commentsSchema
    ]);
    console.log('Created Tables')
}
let unsubscribe;
const users = database.tables.get('users');
const regularUsers = new Query(users);
regularUsers.andWhere({
    column: "isAdmin",
    op: Operators.EQ,
    value: false,
});
const adminsQuery = new Query(users)
.andWhere({
    column: "isAdmin",
    op: Operators.EQ,
    value: true,
});
const admins = adminsQuery.find();
const regUsers = regularUsers.find();
regularUsers.subscribe();
console.log("Admins:", admins.map((user) => user.get('name')).join(", "));
console.log("Regular Users:", regUsers.map((user) => user.get('name')).join(", "));
adminsQuery.subscribe();
adminsQuery.on('added', (user, resultset) => {
    console.log("+ Admin:", user.get('name'));
    if(resultset.length) console.log("All Admins:", resultset.map((user) => user.get('name')).join(", "));
});
adminsQuery.on('removed', (user, resultset) => {
    console.log("- Admin:", user.get('name'));
    if(resultset.length) console.log("All Admins:", resultset.map((user) => user.get('name')).join(", "));
});
adminsQuery.on('updated', (user, resultset) => {
    console.log("Updated Admin:", user.get('name'), "to age", user.get('age'));
    // if(resultset.length) console.log("All Admins:", resultset.map((user) => user.get('name')).join(", "));
});
regularUsers.on('added', (user, resultset) => {
    console.log("+ User:", user.get('name'));
    if(resultset.length) console.log("All Users:", resultset.map((user) => user.get('name')).join(", "));
});
regularUsers.on('removed', (user, resultset) => {
    console.log("- User:", user.get('name'));
    if(resultset.length) console.log("All Users:", resultset.map((user) => user.get('name')).join(", "));
});
const comments = database.tables.get('comments');
const addQuery = new Query(comments);
const commentsQuery = new Query(comments);
commentsQuery.subscribe();
commentsQuery.on('added', (comment, resultset) => {
    const userQuery = new Query(users);
    const user = userQuery.where({
        column: "id",
        op: Operators.EQ,
        value: comment.get('userId'),
    }).find();
    if(user.length) console.log("+ Comment:", comment.get('content'), "by", user[0].get('name'));
});
addQuery.insert({
    userId: 4,
    content: "no, just you!",
})
try {
    // addQuery.execute();
} catch (error) {
    console.log(error.message);
}