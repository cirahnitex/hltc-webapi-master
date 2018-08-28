import * as fs from "fs-extra";
import {QSTATUS, INSTALLED_WEBAPIS} from "./paths";
import {getCurrentSgeQueue, ensureNotOnComputationNode} from "./job/SGEQueue";

import QJob from "./job/Job";
import * as SGEJobManager from "./job/SGEJobManager";
import * as ProcessJobManager from "./job/ProcessJobManager";

export default async function():Promise<{active:QJob[],stopped:string[]}> {

    let JobManager: typeof SGEJobManager | typeof ProcessJobManager = SGEJobManager;
    const queue = await ensureNotOnComputationNode();
    if(queue == null) {
        JobManager = ProcessJobManager;
    }
    const inQueueJobNames = {};
    const jobs = await JobManager.listJobs();
    jobs.forEach(job=>{
        inQueueJobNames[job.webapiName] = true;
    });

    let webapiNames:string[] = [];
    try {
        webapiNames = await fs.readdir(INSTALLED_WEBAPIS);
        webapiNames = webapiNames.filter(name=>!inQueueJobNames.hasOwnProperty(name));
    }
    catch(e) {

    }
    return {active:jobs, stopped:webapiNames};
};