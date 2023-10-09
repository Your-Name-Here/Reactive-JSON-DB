"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateString = exports.ValidateNumeric = exports.ValidateBoolean = exports.ValidateArrayLength = exports.ValidateISODate = exports.ValidateURL = exports.ValidateEmail = exports.ValidationType = void 0;
var ValidationType;
(function (ValidationType) {
    ValidationType[ValidationType["EMAIL"] = 0] = "EMAIL";
    ValidationType[ValidationType["DATE"] = 1] = "DATE";
    ValidationType[ValidationType["URL"] = 2] = "URL";
    ValidationType[ValidationType["ARRAY"] = 3] = "ARRAY";
    ValidationType[ValidationType["STRING"] = 4] = "STRING";
    ValidationType[ValidationType["NUMBER"] = 5] = "NUMBER";
    ValidationType[ValidationType["BOOLEAN"] = 6] = "BOOLEAN";
})(ValidationType || (exports.ValidationType = ValidationType = {}));
function ValidateEmail(email) {
    var re = RegExp(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/);
    return re.test(email);
}
exports.ValidateEmail = ValidateEmail;
function ValidateURL(url) {
    var re = /^(ftp|http|https):\/\/[^ "]+$/;
    return re.test(url);
}
exports.ValidateURL = ValidateURL;
function ValidateISODate(dateString) {
    var re = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/; // ISO 8601 format
    return re.test(dateString);
}
exports.ValidateISODate = ValidateISODate;
function ValidateArrayLength(array, minLength, maxLength) {
    const length = array.length;
    return length >= minLength && length <= maxLength;
}
exports.ValidateArrayLength = ValidateArrayLength;
function ValidateBoolean(value) {
    return typeof value === 'boolean';
}
exports.ValidateBoolean = ValidateBoolean;
function ValidateNumeric(value, minimum, maximum) {
    return !isNaN(value) && value >= minimum && value <= maximum;
}
exports.ValidateNumeric = ValidateNumeric;
function ValidateString(value, minLength, maxLength) {
    if (typeof value != 'string')
        return false;
    const length = value.length;
    return length >= minLength && length <= maxLength;
}
exports.ValidateString = ValidateString;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVmFsaWRhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiLi4vc3JjLyIsInNvdXJjZXMiOlsiVmFsaWRhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsSUFBWSxjQVFYO0FBUkQsV0FBWSxjQUFjO0lBQ3RCLHFEQUFLLENBQUE7SUFDTCxtREFBSSxDQUFBO0lBQ0osaURBQUcsQ0FBQTtJQUNILHFEQUFLLENBQUE7SUFDTCx1REFBTSxDQUFBO0lBQ04sdURBQU0sQ0FBQTtJQUNOLHlEQUFPLENBQUE7QUFDWCxDQUFDLEVBUlcsY0FBYyw4QkFBZCxjQUFjLFFBUXpCO0FBQ0QsU0FBZ0IsYUFBYSxDQUFDLEtBQVk7SUFDdEMsSUFBSSxFQUFFLEdBQUcsTUFBTSxDQUFDLGlEQUFpRCxDQUFDLENBQUM7SUFDbkUsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzFCLENBQUM7QUFIRCxzQ0FHQztBQUNELFNBQWdCLFdBQVcsQ0FBQyxHQUFVO0lBQ2xDLElBQUksRUFBRSxHQUFHLCtCQUErQixDQUFDO0lBQ3pDLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN4QixDQUFDO0FBSEQsa0NBR0M7QUFDRCxTQUFnQixlQUFlLENBQUMsVUFBaUI7SUFDN0MsSUFBSSxFQUFFLEdBQUcsOENBQThDLENBQUMsQ0FBQyxrQkFBa0I7SUFDM0UsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQy9CLENBQUM7QUFIRCwwQ0FHQztBQUNELFNBQWdCLG1CQUFtQixDQUFDLEtBQVcsRUFBRSxTQUFnQixFQUFFLFNBQWdCO0lBQy9FLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7SUFDNUIsT0FBTyxNQUFNLElBQUksU0FBUyxJQUFJLE1BQU0sSUFBSSxTQUFTLENBQUM7QUFDdEQsQ0FBQztBQUhELGtEQUdDO0FBQ0QsU0FBZ0IsZUFBZSxDQUFDLEtBQVM7SUFDckMsT0FBTyxPQUFPLEtBQUssS0FBSyxTQUFTLENBQUM7QUFDdEMsQ0FBQztBQUZELDBDQUVDO0FBQ0QsU0FBZ0IsZUFBZSxDQUFDLEtBQVMsRUFBRSxPQUFjLEVBQUUsT0FBYztJQUNyRSxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssSUFBSSxPQUFPLElBQUksS0FBSyxJQUFJLE9BQU8sQ0FBQztBQUNqRSxDQUFDO0FBRkQsMENBRUM7QUFDRCxTQUFnQixjQUFjLENBQUMsS0FBUyxFQUFFLFNBQWdCLEVBQUUsU0FBZ0I7SUFDeEUsSUFBRyxPQUFPLEtBQUssSUFBSSxRQUFRO1FBQUMsT0FBTyxLQUFLLENBQUM7SUFDekMsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUM1QixPQUFPLE1BQU0sSUFBSSxTQUFTLElBQUksTUFBTSxJQUFJLFNBQVMsQ0FBQztBQUN0RCxDQUFDO0FBSkQsd0NBSUMifQ==