import Job, {clearLog, generatePortNumber, getEntryScript} from "./Job";
import {INSTALLED_WEBAPIS, QSTATUS, WEBAPI_STDERR_LOG, WEBAPI_STDOUT_LOG} from "../paths";
import {exec} from "ts-process-promises";
import QStatusParser from "./QStatusParser";
import {printInfo} from "../util/consoleStyles";
import * as fs from "fs-extra";
import delay from "../delay";
import chalk from "chalk";

async function killWaitingJobs(aJob:Job[]) {
    for(let job of aJob) {
        if(job.id && !job.isRunning) {
            await exec(`qdel ${job.id}`,{timeout:10000});
        }
    }
}

export async function findOneJob(filter:Partial<Job>):Promise<null|Job> {
    const parser = new QStatusParser();
    const {stdout} = await exec(QSTATUS);
    parser.parse(stdout);
    return parser.matchOne(filter);
}


export async function findJobs(filter:Partial<Job>):Promise<Job[]> {
    const parser = new QStatusParser();
    const {stdout} = await exec(QSTATUS);
    parser.parse(stdout);
    return parser.matchMany(filter);
}

export async function listJobs():Promise<Job[]> {
    const parser = new QStatusParser();
    const {stdout} = await exec(QSTATUS);
    parser.parse(stdout);
    return parser.aJob;
}

export async function startJob(webapiName: string, numInstances: number):Promise<Job[]> {
    const parser = new QStatusParser();

    // get the entry script and protocol
    const entryScriptMeta = await getEntryScript(webapiName);
    if(!entryScriptMeta) {
        throw new Error("ENTRY_SCRIPT_NOT_FOUND");
    }
    const entryScript = entryScriptMeta.path;
    const protocol = entryScriptMeta.protocol;

    printInfo("entry script: "+chalk.cyan(entryScript));

    const port = generatePortNumber();

    printInfo("clearing existing log");
    await clearLog(webapiName);

    const packedName = Job.serializeName(webapiName, port, protocol);
    const qsubCmd = `qsub -o ${WEBAPI_STDOUT_LOG} -e ${WEBAPI_STDERR_LOG} -v PORT=${port} -N ${packedName} -wd ${INSTALLED_WEBAPIS}/${webapiName} ${entryScript}`;
    printInfo(`performing qsub: ${chalk.cyan(qsubCmd)} for ${chalk.cyan(numInstances.toString())} times`);
    for(let i=0; i<numInstances; i++) {
        await exec(qsubCmd);
    }

    // busy wait for the webapi to start
    let jobs:Job[];
    await delay(2000);
    for(let i=0; (jobs = await findJobs({webapiName:webapiName,isRunning:true})).length<numInstances; i++) {
        if(i>=30) {
            await killWaitingJobs(parser.aJob);
            throw new Error("EXEC_TIMEOUT");
        }
        printInfo(`instances started: ${chalk.cyan(jobs.length.toString())}`);
        await delay(2000);
    }
    printInfo(`instances started: ${chalk.cyan(jobs.length.toString())}`);
    return jobs;
}