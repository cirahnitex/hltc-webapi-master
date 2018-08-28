"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Job_1 = require("./Job");
class QStatusParser {
    constructor() {
        this.aJob = [];
    }
    static parseJob(line) {
        const match = line.match(/([0-9]+)\s+([\-!a-z]+)\s+(hltc[0-9]+)?.+\s(.*)$/);
        if (!match)
            return null;
        const ret = new Job_1.default();
        ret.isRunning = (match[2] === "-r--") || (match[2] === "!r--");
        ret.id = match[1];
        ret.host = match[3];
        const unpackedName = Job_1.default.deserializeName(match[4]);
        if (!unpackedName)
            return null;
        ret.port = unpackedName.port;
        ret.protocol = unpackedName.protocol;
        ret.webapiName = unpackedName.webapiName;
        return ret;
    }
    parse(stdout) {
        this.aJob = [];
        const aLine = stdout.trim().split("\n");
        for (let i = 0; i < aLine.length; i++) {
            const line = aLine[i];
            const job = QStatusParser.parseJob(line);
            if (!job)
                continue;
            this.aJob.push(job);
        }
    }
    matchOne(obj) {
        for (let i = 0; i < this.aJob.length; i++) {
            const job = this.aJob[i];
            let matched = true;
            for (let key in obj) {
                if (!obj.hasOwnProperty(key))
                    continue;
                if (job[key] !== obj[key]) {
                    matched = false;
                    break;
                }
            }
            if (matched) {
                return job;
            }
        }
        return null;
    }
}
exports.default = QStatusParser;
//# sourceMappingURL=QStatusParser.js.map