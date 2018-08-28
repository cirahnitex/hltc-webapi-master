"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ts_process_promises_1 = require("ts-process-promises");
function getMany(cwd, ...varNames) {
    return __awaiter(this, void 0, void 0, function* () {
        const { stderr, stdout } = yield ts_process_promises_1.exec(`make ${varNames.map(name => 'print-' + name).join(" ")}`, { cwd: cwd })
            .catch(() => ({ stderr: "", stdout: "" }));
        const aLine = stdout.trim().split("\n");
        const ret = [];
        for (const varName of varNames) {
            const pattern = new RegExp(`^${varName}\\s*=\\s*'?([^']*)'?$`);
            let value = "";
            for (const line of aLine) {
                const match = line.match(pattern);
                if (match) {
                    value = match[1];
                    break;
                }
            }
            ret.push(value);
        }
        return ret;
    });
}
exports.getMany = getMany;
function getOne(cwd, varName) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield getMany(cwd, varName))[0];
    });
}
exports.getOne = getOne;
//# sourceMappingURL=MakeVariables.js.map