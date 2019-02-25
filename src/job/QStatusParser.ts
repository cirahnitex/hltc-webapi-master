import Job from "./Job";

export default class QStatusParser {

    aJob:Job[] = [];

    static parseJob(line:string):Job|null {
        const match = line.match(/([0-9]+)\s+([\-!a-z]+)\s+(hltc[0-9]+)?.+\s(.*)$/);
        if (!match) return null;
        const ret = new Job();
        ret.isRunning = (match[2] === "-r--") || (match[2] === "!r--");
        ret.id = match[1];
        ret.host = match[3];
        const unpackedName = Job.deserializeName(match[4]);
        if(!unpackedName) return null;
        ret.port = unpackedName.port;
        ret.protocol = unpackedName.protocol;
        ret.webapiName = unpackedName.webapiName;
        return ret;
    }

    parse(stdout:string) {
        this.aJob = [];
        const aLine = stdout.trim().split("\n");
        for (let i = 0; i < aLine.length; i++) {
            const line = aLine[i];
            const job = QStatusParser.parseJob(line);
            if (!job) continue;
            this.aJob.push(job);
        }
    }

    matchOne(obj:Partial<Job>):null|Job {
        for (let i = 0; i < this.aJob.length; i++) {
            const job = this.aJob[i];
            let matched = true;
            for (let key in obj) {
                if (!obj.hasOwnProperty(key)) continue;
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

    matchMany(obj:Partial<Job>):Job[] {
        const ret:Job[] = [];
        for (let i = 0; i < this.aJob.length; i++) {
            const job = this.aJob[i];
            let matched = true;
            for (let key in obj) {
                if (!obj.hasOwnProperty(key)) continue;
                if (job[key] !== obj[key]) {
                    matched = false;
                    break;
                }
            }

            if (matched) {
                ret.push(job);
            }
        }
        return ret;
    }

}
