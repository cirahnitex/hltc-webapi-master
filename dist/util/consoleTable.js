"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Table = require("cli-table2");
const chalk_1 = require("chalk");
function default_1(objs) {
    const headersSet = new Set();
    for (const obj of objs) {
        if (typeof (obj) !== 'object')
            throw new Error("consoleTable: expect an array of object");
        Object.keys(obj).forEach(key => headersSet.add(key));
    }
    const headers = Array.from(headersSet.keys());
    const table = new Table({
        head: headers.map(header => chalk_1.default.cyan(header))
    });
    for (const obj of objs) {
        table.push(headers.map(key => obj[key] == null ? "" : obj[key].toString()));
    }
    return table.toString();
}
exports.default = default_1;
//# sourceMappingURL=consoleTable.js.map