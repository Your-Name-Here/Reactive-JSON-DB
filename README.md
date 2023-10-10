# Reactive-JSON-DB
![GitHub Workflow Status (with event)](https://img.shields.io/github/actions/workflow/status/Your-Name-Here/Reactive-JSON-DB/node.js.yml)
 ![GitHub package.json version (branch)](https://img.shields.io/github/package-json/v/Your-Name-Here/Reactive-JSON-DB/main) ![GitHub](https://img.shields.io/github/license/Your-Name-Here/Reactive-JSON-DB) ![GitHub repo size](https://img.shields.io/github/repo-size/Your-Name-Here/Reactive-JSON-DB?label=Repo%20Size) ![GitHub issues](https://img.shields.io/github/issues-raw/Your-Name-Here/Reactive-JSON-DB) ![GitHub closed issues](https://img.shields.io/github/issues-closed-raw/Your-Name-Here/Reactive-JSON-DB) ![GitHub last commit (by committer)](https://img.shields.io/github/last-commit/Your-Name-Here/Reactive-JSON-DB) ![GitHub commit activity (branch)](https://img.shields.io/github/commit-activity/m/Your-Name-Here/Reactive-JSON-DB)







A self-hosted JSON file database that is reactive similar to Firestore. The project was born from a frustration with the currently available options. Most self-hosted solutions require Docker which can be a pain to set up and or use. This will solve that because this package will have a smaller footprint and only require node.   

The final intended usage will be as an NPM package. I would love the ability to use on the front end with indexDB and/or localStorage.

### Install 
``npm install reactiveDB@node -s``

## Usage
**At the top of your file:**

```javascript
import { RDatabase } from 'reactiveDB';
```

**Then create a schema for your first table**
```javascript
const  userSchema: TableSchema = { 
	name: "users",
	columns: [
		{ name: 'id', type: ValidationType.STRING, unique: true, autoIncrement: true },
		{ name: 'isAdmin', type: ValidationType.BOOLEAN, default: false },
		{ name: 'name', type: ValidationType.STRING, unique:true, minimum: 3, maximum: 30 },
		{ name: 'age', type: ValidationType.NUMBER },
		{ name: 'email', type: ValidationType.EMAIL, unique: true },
		{ name: 'password', type: ValidationType.STRING },
		{ name: 'createdAt', type: ValidationType.DATE },
		{ name: 'updatedAt', type: ValidationType.DATE }
] }
```
**Then initialize the database**
```javascript
const databaseDirectory = path.resolve( __dirname ,"..", "dist");
const database = new  RDatabase({ directory });
```
  If there are no table files in that directory, you'll need to call:
  
```javascript
// Create the table with an array of schemas. (only one in this case)
database.create([
  userschema
])
```

Once this has been done, your table is ready for querying. 

## Querying

```javascript
const users = database.tables.get('users'); // reference the table
```

### Fetching
Allows you to get data from the database. 
**Create the query object**;

```javascript
const oldPeople = new Query(users)
.where({
  column: 'age',
  operator: Operators.GT,
  value: 30
});
```
 ___
|Method|Description|
|--|--|
| limit(number) | Limit the result set to number, max|
| where( fetchQuery ) | Drill down to a subset of records |
| orderBy(columnName, 'ASC' or 'DESC') | Sorts the result set |
| set(column, value) | Used to create an update query |
| insert(data) | Used to create an insert query |
| delete() | Used to create an insert query. requires a ``Where()`` |

get the data;

```javascript
const elders = oldPeople.find()
```
``elders`` will now be an array of ``RDBRecord``
### Subscribing
You can subscribe to a query that is of type 'fetch' only. From our example above;

```javascript
oldPeople.subscribe( )
```
```javascript
  oldPeople.on('added', (item: RDBRecord, recordSet: RDBRecord[])=>{
    // item is the newly added record, and recordSet is the result of the query after the insertion. 
  })
  oldPeople.on('updated', (item: RDBRecord, recordSet: RDBRecord[])=>{
    // item is the updated record, and recordSet is the result of the query after the update. 
  })
  oldPeople.on('removed', (item: RDBRecord, recordSet: RDBRecord[])=>{
    // item is the removed record, and recordSet is the result of the query after the removal. 
  })

```
Each updates.added, removed, or updates 
### Update
Changes all of the records returned by the query to be admins...
```javascript
oldPeople.update({
  'isAdmin', true
}).execute()
```
### Delete
```javascript
oldPeople.delete().execute() // Whoa...
```
## RDBRecord
This is an object that represents a record in the database. It extends Map so you access columns with ``record.get('columnName')``
___
|Property|Description|
|--|--|
| id | The internal id of the record   |
___

|Method |Description|
|--|--|
| subscribe( fn: Function ) | Used to subscribe to the records changes|
| remove( ) | Used to remove the recod from the database|
| update (column: string, value: any, autosave?:bool) | Used to change a columns data. Defaults to autosave: true|
| save | Used to commit the records changes done through update(). Not necessary by default |

### Subscribing to a record for changes
```javascript
record.subscribe(changes => {
  // changes.updated will be a new record 
})
```

 
## TODO:
- Set up tests
- Set up workflow as github actions.
  - Automated testing
  - Automated publishing to NPM
  - Automated Typescript Transpilation