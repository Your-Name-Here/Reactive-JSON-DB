export declare enum ValidationType {
    EMAIL = 0,
    DATE = 1,
    URL = 2,
    ARRAY = 3,
    STRING = 4,
    NUMBER = 5,
    BOOLEAN = 6
}
export declare function ValidateEmail(email: string): boolean;
export declare function ValidateURL(url: string): boolean;
export declare function ValidateISODate(dateString: string): boolean;
export declare function ValidateArrayLength(array: any[], minLength: number, maxLength: number): boolean;
export declare function ValidateBoolean(value: any): boolean;
export declare function ValidateNumeric(value: any, minimum: number, maximum: number): boolean;
export declare function ValidateString(value: any, minLength: number, maxLength: number): boolean;
