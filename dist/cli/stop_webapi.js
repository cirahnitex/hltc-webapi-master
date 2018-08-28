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
const listWebapis_1 = require("../listWebapis");
const chalk_1 = require("chalk");
const program = require("commander");
const ts_process_promises_1 = require("ts-process-promises");
const consoleStyles_1 = require("../util/consoleStyles");
const SGEQueue_1 = require("../job/SGEQueue");
program
    .version("0.1.0")
    .description("start a WebAPI by name")
    .command(`<webapi-name>`)
    .parse(process.argv);
if (process.argv.length !== 3)
    program.help();
const webapiName = process.argv[2];
(() => __awaiter(this, void 0, void 0, function* () {
    const { active, stopped } = yield listWebapis_1.default();
    let jobId = null;
    for (const webapi of active) {
        if (webapi.webapiName === webapiName) {
            jobId = webapi.id;
        }
    }
    if (jobId == null) {
        consoleStyles_1.printError(`Cannot find running WebAPI with name ${webapiName}`);
        process.exit(-1);
        return;
    }
    const queue = yield SGEQueue_1.ensureNotOnComputationNode();
    if (queue === 'hltc00') {
        const command = `qdel ${jobId}`;
        consoleStyles_1.printInfo("executing " + chalk_1.default.cyan(command));
        yield ts_process_promises_1.exec(command);
    }
    else {
        consoleStyles_1.printInfo("killing process tree " + chalk_1.default.cyan(jobId));
        process.kill(-jobId);
    }
}))();
//# sourceMappingURL=stop_webapi.js.map