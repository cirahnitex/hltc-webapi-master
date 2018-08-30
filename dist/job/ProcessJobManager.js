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
const consoleStyles_1 = require("../util/consoleStyles");
const chalk_1 = require("chalk");
const child_process_1 = require("child_process");
const psList = require("ps-list");
const delay_1 = require("../delay");
const paths_1 = require("../paths");
const Path = require("path");
const fs = require("fs-extra");
const MakeVariable = require("../MakeVariables");
const PROCESS_PAYLOAD_BOUNDARY = 'c4yP';
function listJobs() {
    return __awaiter(this, void 0, void 0, function* () {
        const list = yield psList();
        const ret = [];
        for (const { pid, cmd } of list) {
            const splits = cmd.split(PROCESS_PAYLOAD_BOUNDARY);
            if (splits.length !== 3)
                continue;
            const unpackedName = Job_1.default.deserializeName(splits[1]);
            if (!unpackedName)
                continue;
            const job = new Job_1.default();
            job.webapiName = unpackedName.webapiName;
            job.protocol = unpackedName.protocol;
            job.port = unpackedName.port;
            job.isRunning = true;
            job.host = "127.0.0.1";
            job.id = pid.toString();
            ret.push(job);
        }
        return ret;
    });
}
exports.listJobs = listJobs;
function findOneJob(filter) {
    return __awaiter(this, void 0, void 0, function* () {
        const jobs = yield listJobs();
        for (const job of jobs) {
            let match = true;
            for (const key of Object.keys(filter)) {
                if (job[key] !== filter[key]) {
                    match = false;
                    break;
                }
            }
            if (match)
                return job;
        }
        return null;
    });
}
exports.findOneJob = findOneJob;
function stringSimilarity(str1, str2) {
    let i = 0;
    for (i = 0; i < str1.length; i++) {
        if (i < str2.length && str2[i] === str1[i])
            continue;
    }
    return i;
}
function findCloestPlatformType(entryScriptDir, realPlatformType) {
    return __awaiter(this, void 0, void 0, function* () {
        const files = yield fs.readdir(entryScriptDir);
        let maxSimilarity = 0;
        let bestPlatform = null;
        for (const iPlatform of files) {
            const stat = yield fs.stat(Path.join(entryScriptDir, iPlatform));
            if (!stat.isDirectory())
                continue;
            const sim = stringSimilarity(realPlatformType, iPlatform);
            if (sim > maxSimilarity) {
                maxSimilarity = sim;
                bestPlatform = iPlatform;
            }
        }
        if (bestPlatform == null) {
            throw new Error(`no installed WebAPI`);
        }
        if (bestPlatform !== realPlatformType) {
            consoleStyles_1.printWarning(`no installed WebAPI for platform ${realPlatformType}, using nearest match ${bestPlatform} instead.`);
        }
        return bestPlatform;
    });
}
function startJob(webapiName) {
    return __awaiter(this, void 0, void 0, function* () {
        // get the entry script and protocol
        const entryScriptMeta = yield Job_1.getEntryScript(webapiName);
        if (!entryScriptMeta) {
            throw new Error("entry script not found");
        }
        const entryScript = entryScriptMeta.path;
        const protocol = entryScriptMeta.protocol;
        consoleStyles_1.printInfo("entry script: " + chalk_1.default.cyan(entryScript));
        const entryScriptDir = Path.dirname(entryScript);
        const port = Job_1.generatePortNumber();
        const stderrFile = yield fs.open(`${entryScriptDir}/${paths_1.WEBAPI_STDERR_LOG}`, 'w');
        const stdoutFile = yield fs.open(`${entryScriptDir}/${paths_1.WEBAPI_STDOUT_LOG}`, 'w');
        const jobName = Job_1.default.serializeName(webapiName, port, protocol);
        const cloestPlatformType = yield findCloestPlatformType(entryScriptDir, yield MakeVariable.getOne(paths_1.DEV, "PLATFORM_TYPE"));
        consoleStyles_1.printInfo(`runnung ${entryScript} ${PROCESS_PAYLOAD_BOUNDARY + jobName + PROCESS_PAYLOAD_BOUNDARY}`);
        const subProcess = child_process_1.spawn(`${entryScript}`, [PROCESS_PAYLOAD_BOUNDARY + jobName + PROCESS_PAYLOAD_BOUNDARY], { env: Object.assign({}, process.env, { PORT: port, PLATFORM_TYPE: cloestPlatformType }), cwd: entryScriptDir, detached: true, stdio: ['ignore', stdoutFile, stderrFile] });
        subProcess.unref();
        // busy wait for the webapi to start
        let job;
        yield delay_1.default(2000);
        job = yield findOneJob({ webapiName: webapiName, isRunning: true });
        if (!job) {
            const errLogContent = yield fs.readFile(`${entryScriptDir}/${paths_1.WEBAPI_STDERR_LOG}`, 'utf8').catch(e => "");
            if (errLogContent.trim.length <= 0) {
                throw new Error("job error: (empty error log)");
            }
            else {
                throw new Error("job error: " + errLogContent);
            }
        }
        return job;
    });
}
exports.startJob = startJob;
//# sourceMappingURL=ProcessJobManager.js.map