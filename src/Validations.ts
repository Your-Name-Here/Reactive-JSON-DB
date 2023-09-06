export enum ValidationType {
    EMAIL,
    DATE,
    URL,
    ARRAY,
    STRING,
    NUMBER,
    BOOLEAN,

}
export function ValidateEmail(email){
    var re = RegExp(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/);
    return re.test(email);
}
export function ValidateURL(url) {
    var re = /^(ftp|http|https):\/\/[^ "]+$/;
    return re.test(url);
}
export function ValidateISODate(dateString) {
    var re = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/; // ISO 8601 format
    return re.test(dateString);
}
export function ValidateArrayLength(array, minLength, maxLength) {
    const length = array.length;
    return length >= minLength && length <= maxLength;
}
export function ValidateBoolean(value) {
    return typeof value === 'boolean';
}
export function ValidateNumeric(value, minimum, maximum) {
    return !isNaN(value) && value >= minimum && value <= maximum;
}
export function ValidateString(value, minLength, maxLength) {
    if(typeof value != 'string')return false;
    const length = value.length;
    return length >= minLength && length <= maxLength;
}

