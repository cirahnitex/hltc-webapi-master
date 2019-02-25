import {exec} from 'ts-process-promises';
import * as fs from 'fs-extra';
import {
    DEV, INSTALLED_WEBAPIS, QSTATUS, NGINX_CONF_HOME, WEBAPI_STDOUT_LOG, WEBAPI_STDERR_LOG, FCGI_ENTRY_SCRIPT,
    HTTP_ENTRY_SCRIPT, NGINX_BIN
} from "./paths";
import {printError, printInfo} from "./util/consoleStyles";
import {getCurrentSgeQueue, ensureNotOnComputationNode} from "./job/SGEQueue";
import QJob, {getEntryScript} from "./job/Job";
import * as SGEJobManager from "./job/SGEJobManager";
import * as ProcessJobManager from "./job/ProcessJobManager";
import {getMany as makeGetVariables} from "./MakeVariables";

import * as Nginx from "./nginx/Nginx";
import * as http from "http";
import * as querystring from "querystring";
import delay from "./delay";

function call_an_init_api(name:string, instanceIndex:number) {
    return new Promise<string>((resolve, reject)=>{
        // Build the post string from an object
        const post_data = querystring.stringify({
            'format':'json'
        });

        // An object of options to indicate where to post to
        const post_options = {
            host: 'localhost',
            port: '8792',
            path: `/${name}_server_${instanceIndex}/init`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(post_data)
            }
        };

        const post_req = http.request(post_options, function(res) {
            res.setEncoding('utf8');
            let data = '';
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on("error", reject);
            res.on("end", ()=>resolve(data));
        });

        post_req.write(post_data);
        post_req.end();
    });
}

export function call_all_init_apis(name:string, numInstances:number) {
    const promises:Promise<string>[] = [];
    for(let i=0; i<numInstances; i++) {
        promises.push(call_an_init_api(name, i));
    }
    return Promise.all(promises);
}

async function start_webapi(name:string, numInstances:number=1) {

    // safety check: don't accept funny stuffs as module name
    if(!name || !name.match(/^[a-zA-Z0-9_.]+$/)) throw new Error(`Module name malformed. Got "${name}".`);

    // use corresponding job manager depending on hltc00 or other local machines
    let JobManager: typeof SGEJobManager | typeof ProcessJobManager = SGEJobManager;
    const queue = await ensureNotOnComputationNode();
    if(queue == null) {
        JobManager = ProcessJobManager;
    }

    // avoid running multiple instances of the same module
    // even when running additional instances of the same WebAPI, we don't want old versions to keep running
    // so please stop all existing WebAPIs before starting
    if(await JobManager.findOneJob({webapiName:name,isRunning:true})) {
        throw new Error("ALREADY_RUNNING");
    }

    const job = await JobManager.startJob(name, numInstances);

    printInfo("starting NGINX");
    const platformType = (await makeGetVariables(DEV, "PLATFORM_TYPE"))[0];
    await Nginx.syncNginxWithJobList(NGINX_BIN(platformType), NGINX_CONF_HOME, await JobManager.listJobs());
    await delay(5000);
    printInfo("calling init function");

    try {
        await call_all_init_apis(name, numInstances);
    }
    catch(e) {
        console.log(e.message);
    }

    printInfo("done");
    return job;
}

export default start_webapi;
