import Job, {clearLog, generatePortNumber, getEntryScript} from "./Job";
import {printInfo} from "../util/consoleStyles";
import chalk from "chalk";
import QStatusParser from "./QStatusParser";
import {spawn} from "child_process";
import * as psList from "ps-list";
import delay from "../delay";
import {WEBAPI_STDOUT_LOG, WEBAPI_STDERR_LOG} from "../paths";
import * as Path from "path";
import * as fs from "fs-extra"

const PROCESS_PAYLOAD_BOUNDARY = 'c4yP';

export async function listJobs():Promise<Job[]> {
    const list = await psList();
    const ret:Job[] = [];
    for(const {pid, cmd} of list) {
        const splits = cmd.split(PROCESS_PAYLOAD_BOUNDARY);
        if(splits.length!==3) continue;
        const unpackedName = Job.deserializeName(splits[1]);
        if(!unpackedName) continue;
        const job = new Job();
        job.webapiName = unpackedName.webapiName;
        job.protocol = unpackedName.protocol;
        job.port = unpackedName.port;
        job.isRunning = true;
        job.host = "127.0.0.1";
        job.id = pid.toString();
        ret.push(job);
    }
    return ret;
}

export async function findOneJob(filter:Partial<Job>):Promise<Job|null> {
    const jobs = await listJobs();
    for(const job of jobs) {
        let match = true;
        for(const key of Object.keys(filter)) {
            if(job[key] !== filter[key]) {
                match = false;
                break;
            }
        }
        if(match) return job;
    }
    return null;
}

export async function startJob(webapiName:string):Promise<Job> {

    // get the entry script and protocol
    const entryScriptMeta = await getEntryScript(webapiName);
    if(!entryScriptMeta) {
        throw new Error("ENTRY_SCRIPT_NOT_FOUND");
    }
    const entryScript = entryScriptMeta.path;
    const protocol = entryScriptMeta.protocol;

    printInfo("entry script: "+chalk.cyan(entryScript));
    const entryScriptDir = Path.dirname(entryScript);

    const port = generatePortNumber();

    const stderrFile = await fs.open(`${entryScriptDir}/${WEBAPI_STDERR_LOG}`,'w');
    const stdoutFile = await fs.open(`${entryScriptDir}/${WEBAPI_STDOUT_LOG}`,'w');

    const jobName = Job.serializeName(webapiName, port, protocol);

    printInfo(`runnung ${entryScript} ${PROCESS_PAYLOAD_BOUNDARY + jobName + PROCESS_PAYLOAD_BOUNDARY}`);
    const subProcess = spawn(`${entryScript}`,[PROCESS_PAYLOAD_BOUNDARY + jobName + PROCESS_PAYLOAD_BOUNDARY], {env:{...process.env, PORT:port},cwd:entryScriptDir,detached:true,stdio:[ 'ignore', stdoutFile, stderrFile ]});
    subProcess.unref();
    // busy wait for the webapi to start
    let job:Job|null;
    await delay(2000);
    for(let i=0; !(job = await findOneJob({webapiName:webapiName,isRunning:true})); i++) {
        if(i>=30) {
            throw new Error("EXEC_TIMEOUT");
        }
        printInfo(`waiting for the job ${chalk.cyan(webapiName)} to be running`);
        await delay(2000);
    }
    return job;
}