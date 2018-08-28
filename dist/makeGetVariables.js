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
function makeGetVariables(cwd, ...varNames) {
    return __awaiter(this, void 0, void 0, function* () {
        const { stderr, stdout } = yield ts_process_promises_1.exec(`make ${varNames.map(name => 'echo-' + name).join(" ")}`, { cwd: cwd })
            .catch(() => ({ stderr: "", stdout: "" }));
        const aLine = stdout.trim().split("\n");
        const ret = [];
        for (const line of aLine) {
            ret.push(line);
        }
        return ret;
    });
}
exports.default = makeGetVariables;
//# sourceMappingURL=makeGetVariables.js.map