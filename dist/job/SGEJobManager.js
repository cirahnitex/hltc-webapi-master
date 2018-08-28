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
const Job_1 = require("./Job");
const paths_1 = require("../paths");
const ts_process_promises_1 = require("ts-process-promises");
const QStatusParser_1 = require("./QStatusParser");
const consoleStyles_1 = require("../util/consoleStyles");
const delay_1 = require("../delay");
const chalk_1 = require("chalk");
function killWaitingJobs(aJob) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let job of aJob) {
            if (job.id && !job.isRunning) {
                yield ts_process_promises_1.exec(`qdel ${job.id}`, { timeout: 10000 });
            }
        }
    });
}
function findOneJob(filter) {
    return __awaiter(this, void 0, void 0, function* () {
        const parser = new QStatusParser_1.default();
        const { stdout } = yield ts_process_promises_1.exec(paths_1.QSTATUS);
        parser.parse(stdout);
        return parser.matchOne(filter);
    });
}
exports.findOneJob = findOneJob;
function listJobs() {
    return __awaiter(this, void 0, void 0, function* () {
        const parser = new QStatusParser_1.default();
        const { stdout } = yield ts_process_promises_1.exec(paths_1.QSTATUS);
        parser.parse(stdout);
        return parser.aJob;
    });
}
exports.listJobs = listJobs;
function startJob(webapiName) {
    return __awaiter(this, void 0, void 0, function* () {
        const parser = new QStatusParser_1.default();
        // get the entry script and protocol
        const entryScriptMeta = yield Job_1.getEntryScript(webapiName);
        if (!entryScriptMeta) {
            throw new Error("ENTRY_SCRIPT_NOT_FOUND");
        }
        const entryScript = entryScriptMeta.path;
        const protocol = entryScriptMeta.protocol;
        consoleStyles_1.printInfo("entry script: " + chalk_1.default.cyan(entryScript));
        const port = Job_1.generatePortNumber();
        consoleStyles_1.printInfo("clearing existing log");
        yield Job_1.clearLog(webapiName);
        const packedName = Job_1.default.serializeName(webapiName, port, protocol);
        const qsubCmd = `qsub -o ${paths_1.WEBAPI_STDOUT_LOG} -e ${paths_1.WEBAPI_STDERR_LOG} -v PORT=${port} -N ${packedName} -wd ${paths_1.INSTALLED_WEBAPIS}/${webapiName} ${entryScript}`;
        consoleStyles_1.printInfo(`performing qsub: ${chalk_1.default.cyan(qsubCmd)}`);
        yield ts_process_promises_1.exec(qsubCmd);
        // busy wait for the webapi to start
        let job;
        yield delay_1.default(2000);
        for (let i = 0; !(job = yield findOneJob({ webapiName: webapiName, isRunning: true })); i++) {
            if (i >= 30) {
                yield killWaitingJobs(parser.aJob);
                throw new Error("EXEC_TIMEOUT");
            }
            consoleStyles_1.printInfo(`waiting for the job ${chalk_1.default.cyan(webapiName)} to be running`);
            yield delay_1.default(2000);
        }
        return job;
    });
}
exports.startJob = startJob;
//# sourceMappingURL=SGEJobManager.js.map