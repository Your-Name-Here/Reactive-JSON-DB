export enum ValidationType {
    EMAIL,
    DATE,
    URL,
    ARRAY,
    STRING,
    NUMBER,
    BOOLEAN,

}
export function ValidateEmail(email:string){
    var re = RegExp(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/);
    return re.test(email);
}
export function ValidateURL(url:string) {
    var re = /^(ftp|http|https):\/\/[^ "]+$/;
    return re.test(url);
}
export function ValidateISODate(dateString:string) {
    var re = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/; // ISO 8601 format
    return re.test(dateString);
}
export function ValidateArrayLength(array:any[], minLength:number, maxLength:number) {
    const length = array.length;
    return length >= minLength && length <= maxLength;
}
export function ValidateBoolean(value:any) {
    return typeof value === 'boolean';
}
export function ValidateNumeric(value:any, minimum:number, maximum:number) {
    return !isNaN(value) && value >= minimum && value <= maximum;
}
export function ValidateString(value:any, minLength:number, maxLength:number) {
    if(typeof value != 'string')return false;
    const length = value.length;
    return length >= minLength && length <= maxLength;
}

