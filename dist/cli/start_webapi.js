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
const startWebapi_1 = require("../startWebapi");
const chalk_1 = require("chalk");
const program = require("commander");
const consoleStyles_1 = require("../util/consoleStyles");
const listWebapis_1 = require("../listWebapis");
program
    .description("start a WebAPI by name")
    .arguments('<webapi-name>')
    .parse(process.argv);
if (process.argv.length !== 3)
    program.help();
const webapiName = process.argv[2];
(() => __awaiter(this, void 0, void 0, function* () {
    const { active, stopped } = yield listWebapis_1.default();
    for (const webapi of active) {
        if (webapi.webapiName === webapiName) {
            consoleStyles_1.printError(`a WebAPI named ${chalk_1.default.cyan(webapiName)} is already running`);
            process.exit(-1);
        }
    }
    if (stopped.indexOf(webapiName) < 0) {
        consoleStyles_1.printError(`the WebAPI ${chalk_1.default.cyan(webapiName)} is not installed`);
        process.exit(-1);
    }
    try {
        yield startWebapi_1.default(webapiName);
    }
    catch (e) {
        consoleStyles_1.printError(e.message);
    }
}))();
//# sourceMappingURL=start_webapi.js.map