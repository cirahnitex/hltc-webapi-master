"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
function printInfo(str) {
    console.log(`${chalk_1.default.bgCyan.black("INFO")} ${str}`);
}
exports.printInfo = printInfo;
function printWarning(str) {
    console.log(`${chalk_1.default.bgYellow.black("WARN")} ${str}`);
}
exports.printWarning = printWarning;
function printError(str) {
    console.log(`${chalk_1.default.bgRed.black("ERR!")} ${str}`);
}
exports.printError = printError;
//# sourceMappingURL=consoleStyles.js.map