import Job, {clearLog, generatePortNumber, getEntryScript} from "./Job";
import {printInfo, printWarning} from "../util/consoleStyles";
import chalk from "chalk";
import QStatusParser from "./QStatusParser";
import {spawn} from "child_process";
import * as psList from "ps-list";
import delay from "../delay";
import {WEBAPI_STDOUT_LOG, WEBAPI_STDERR_LOG, DEV} from "../paths";
import * as Path from "path";
import * as fs from "fs-extra"
import * as MakeVariable from "../MakeVariables";

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

function stringSimilarity(str1:string, str2:string):number {
    let i=0;
    for(i=0; i<str1.length; i++) {
        if(i<str2.length && str2[i]===str1[i]) continue;
    }
    return i;
}

async function findCloestPlatformType(entryScriptDir:string, realPlatformType:string):Promise<string> {
    const files = await fs.readdir(entryScriptDir);
    let maxSimilarity:number = 0;
    let bestPlatform:string|null = null;
    for(const iPlatform of files) {
        const stat = await fs.stat(Path.join(entryScriptDir, iPlatform));
        if(!stat.isDirectory()) continue;
        const sim = stringSimilarity(realPlatformType, iPlatform);
        if(sim > maxSimilarity) {
            maxSimilarity = sim;
            bestPlatform = iPlatform;
        }
    }
    if(bestPlatform == null) {
        throw new Error(`no installed WebAPI`);
    }
    if(bestPlatform !== realPlatformType) {
        printWarning(`no installed WebAPI for platform ${realPlatformType}, using nearest match ${bestPlatform} instead.`);
    }
    return bestPlatform;
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
    const cloestPlatformType = await findCloestPlatformType(entryScriptDir, await MakeVariable.getOne(DEV, "PLATFORM_TYPE"));
    printInfo(`runnung ${entryScript} ${PROCESS_PAYLOAD_BOUNDARY + jobName + PROCESS_PAYLOAD_BOUNDARY}`);
    const subProcess = spawn(`${entryScript}`,[PROCESS_PAYLOAD_BOUNDARY + jobName + PROCESS_PAYLOAD_BOUNDARY], {env:{...process.env, PORT:port, PLATFORM_TYPE:cloestPlatformType},cwd:entryScriptDir,detached:true,stdio:[ 'ignore', stdoutFile, stderrFile ]});
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