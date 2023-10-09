"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaError = exports.QueryError = exports.DatabaseError = void 0;
class RDBError extends Error {
    constructor(message) {
        super(message);
        this.message = message;
    }
}
class DatabaseError extends RDBError {
    constructor(message) {
        super(message);
    }
}
exports.DatabaseError = DatabaseError;
class QueryError extends RDBError {
    constructor(message) {
        super(message);
    }
}
exports.QueryError = QueryError;
class SchemaError extends RDBError {
    constructor(message) {
        super(message);
    }
}
exports.SchemaError = SchemaError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRXJyb3JzLmpzIiwic291cmNlUm9vdCI6Ii4uL3NyYy8iLCJzb3VyY2VzIjpbIkVycm9ycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxNQUFNLFFBQVMsU0FBUSxLQUFLO0lBRXhCLFlBQVksT0FBYztRQUN0QixLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDZixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztJQUMzQixDQUFDO0NBQ0o7QUFDRCxNQUFhLGFBQWMsU0FBUSxRQUFRO0lBQ3ZDLFlBQVksT0FBYztRQUN0QixLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDbkIsQ0FBQztDQUNKO0FBSkQsc0NBSUM7QUFDRCxNQUFhLFVBQVcsU0FBUSxRQUFRO0lBQ3BDLFlBQVksT0FBYztRQUN0QixLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDbkIsQ0FBQztDQUNKO0FBSkQsZ0NBSUM7QUFDRCxNQUFhLFdBQVksU0FBUSxRQUFRO0lBQ3JDLFlBQVksT0FBYztRQUN0QixLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDbkIsQ0FBQztDQUNKO0FBSkQsa0NBSUMifQ==