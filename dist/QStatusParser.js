"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Job {
    constructor() {
        this.id = "";
        this.host = "hltc00";
        this.name = "";
        this.isRunning = false;
    }
    static parse(line) {
        const match = line.match(/([0-9]+)\s+([\-a-z]+)\s+(hltc[0-9]+)?.+\s(.*)$/);
        if (!match)
            return null;
        const ret = new Job();
        ret.isRunning = (match[2] === "-r--");
        ret.id = match[1];
        ret.host = match[3];
        ret.name = match[4];
        return ret;
    }
    static deserializeName(name) {
        const match = name.match(/^([a-zA-Z0-9]+)_([0-9]+)_(.*)$/);
        if (!match)
            return null;
        return {
            protocol: match[1],
            port: match[2],
            projectName: match[3]
        };
    }
    static serializeName(projectName, port, protocol) {
        return `${protocol}_${port}_${projectName}`;
    }
}
Job.Protocals = {
    FCGI: 'FCGI',
    HTTP: 'HTTP'
};
exports.Job = Job;
class QStatusParser {
    constructor() {
        this.aJob = [];
    }
    parse(stdout) {
        this.aJob = [];
        const aLine = stdout.trim().split("\n");
        for (let i = 0; i < aLine.length; i++) {
            const line = aLine[i];
            const job = Job.parse(line);
            if (!job)
                continue;
            this.aJob.push(job);
        }
    }
    /**
     * expand from running job list to all job list(that contains stopped jobs)
     * @param aJobName a list of all job names(possibly coming from scanning build directory)
     */
    mergeWithAllJobList(aJobName) {
        const runningJobNames = {};
        for (let i = 0; i < this.aJob.length; i++) {
            const job = this.aJob[i];
            if (job.isRunning) {
                runningJobNames[job.name] = 1;
            }
        }
        for (let i = 0; i < aJobName.length; i++) {
            const jobName = aJobName[i];
            if (runningJobNames.hasOwnProperty(jobName))
                continue;
            if (jobName === "main" || jobName === "spawn-fcgi")
                continue;
            const job = new Job();
            job.isRunning = false;
            job.name = jobName;
            this.aJob.push(job);
        }
    }
    match(obj) {
        for (let i = 0; i < this.aJob.length; i++) {
            const job = this.aJob[i];
            let matched = true;
            for (let key in obj) {
                if (!obj.hasOwnProperty(key))
                    continue;
                //$FlowFixMe!
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