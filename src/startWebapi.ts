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


function call_init_api(name:string) {
    return new Promise((resolve, reject)=>{
        // Build the post string from an object
        const post_data = querystring.stringify({
            'format':'json'
        });

        // An object of options to indicate where to post to
        const post_options = {
            host: 'localhost',
            port: '8792',
            path: `${name}/init`,
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

async function start_webapi(name:string) {

    // safety check: don't accept funny stuffs as module name
    if(!name || !name.match(/^[a-zA-Z0-9_.]+$/)) throw new Error(`Module name malformed. Got "${name}".`);

    // use corresponding job manager depending on hltc00 or other local machines
    let JobManager: typeof SGEJobManager | typeof ProcessJobManager = SGEJobManager;
    const queue = await ensureNotOnComputationNode();
    if(queue == null) {
        JobManager = ProcessJobManager;
    }

    // avoid running multiple instances of the same module
    // this behavior may change if we want to run multiple instances and do load balancing in future
    if(await JobManager.findOneJob({webapiName:name,isRunning:true})) {
        throw new Error("ALREADY_RUNNING");
    }

    const job = await JobManager.startJob(name);

    printInfo("starting NGINX");
    const platformType = (await makeGetVariables(DEV, "PLATFORM_TYPE"))[0];
    await Nginx.syncNginxWithJobList(NGINX_BIN(platformType), NGINX_CONF_HOME, await JobManager.listJobs());

    printInfo("calling init function");

    try {
        const res = await call_init_api(name);
        console.log(res);
    }
    catch(e) {
        console.log(e.message);
    }

    printInfo("done");
    return job;
}

export default start_webapi;
