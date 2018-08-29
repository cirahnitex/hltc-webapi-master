import {syncNginxWithJobList} from "../nginx/Nginx";
import {NGINX_CONF_HOME, NGINX_BIN, DEV} from "../paths";
import * as ProcessJobManager from "../job/ProcessJobManager";
import {printInfo} from "../util/consoleStyles";
import * as Nginx from "../nginx/Nginx";
import * as SGEJobManager from "../job/SGEJobManager";
import {getMany as makeGetVariables} from "../MakeVariables";
import {ensureNotOnComputationNode} from "../job/SGEQueue";

import * as program from "commander";
program
    .description("start/restart NGINX")
    .parse(process.argv);

(async ()=>{

    // use corresponding job manager depending on hltc00 or other local machines
    let JobManager: typeof SGEJobManager | typeof ProcessJobManager = SGEJobManager;
    const queue = await ensureNotOnComputationNode();
    if(queue == null) {
        JobManager = ProcessJobManager;
    }

    printInfo("starting NGINX");
    const platformType = (await makeGetVariables(DEV, "PLATFORM_TYPE"))[0];
    await Nginx.syncNginxWithJobList(NGINX_BIN(platformType), NGINX_CONF_HOME, await JobManager.listJobs());

    printInfo("done");
})();
