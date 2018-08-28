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
const paths_1 = require("../paths");
const fs = require("fs-extra");
const chalk_1 = require("chalk");
class Job {
    constructor() {
        this.id = "";
        this.host = "hltc00";
        this.isRunning = false;
        this.protocol = "";
        this.port = 0;
        this.webapiName = "";
    }
    static deserializeName(name) {
        const match = name.match(/^([a-zA-Z0-9]+)_([0-9]+)_(.*)$/);
        if (!match)
            return null;
        return {
            protocol: match[1],
            port: parseInt(match[2]),
            webapiName: match[3]
        };
    }
    static serializeName(webapiName, port, protocol) {
        return `${protocol}_${port}_${webapiName}`;
    }
}
Job.Protocols = {
    FCGI: 'FCGI',
    HTTP: 'HTTP'
};
exports.default = Job;
function getEntryScript(name) {
    return __awaiter(this, void 0, void 0, function* () {
        const fcgiPath = `${paths_1.INSTALLED_WEBAPIS}/${name}/${paths_1.FCGI_ENTRY_SCRIPT}`;
        const httpPath = `${paths_1.INSTALLED_WEBAPIS}/${name}/${paths_1.HTTP_ENTRY_SCRIPT}`;
        if (yield fs.pathExists(fcgiPath)) {
            return {
                path: fcgiPath,
                protocol: Job.Protocols.FCGI,
            };
        }
        if (yield fs.pathExists(httpPath)) {
            return {
                path: httpPath,
                protocol: Job.Protocols.HTTP,
            };
        }
        return null;
    });
}
exports.getEntryScript = getEntryScript;
function generatePortNumber() {
    return Math.floor(9000 + Math.random() * (65535 - 9000));
}
exports.generatePortNumber = generatePortNumber;
function clearLog(webapiName) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`unlink ${chalk_1.default.cyan(`${paths_1.INSTALLED_WEBAPIS}/${webapiName}/${paths_1.WEBAPI_STDOUT_LOG}`)}`);
        console.log(`unlink ${chalk_1.default.cyan(`${paths_1.INSTALLED_WEBAPIS}/${webapiName}/${paths_1.WEBAPI_STDERR_LOG}`)}`);
        yield [
            fs.unlink(`${paths_1.INSTALLED_WEBAPIS}/${webapiName}/${paths_1.WEBAPI_STDOUT_LOG}`).catch(() => { }),
            fs.unlink(`${paths_1.INSTALLED_WEBAPIS}/${webapiName}/${paths_1.WEBAPI_STDERR_LOG}`).catch(() => { }),
        ];
    });
}
exports.clearLog = clearLog;
//# sourceMappingURL=Job.js.map