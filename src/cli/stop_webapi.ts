import listWebapis from "../listWebapis";
import chalk from "chalk";
import * as program from "commander";
import {exec} from "ts-process-promises";
import {printError, printInfo} from "../util/consoleStyles";
import {ensureNotOnComputationNode} from "../job/SGEQueue";

program
    .description("stop a WebAPI by name")
    .arguments('<webapi-name>')
    .parse(process.argv);

if(process.argv.length !== 3) program.help();
const webapiName = process.argv[2];

(async()=>{

    const {active, stopped} = await listWebapis();
    let jobId:string|null = null;
    for(const webapi of active) {
        if(webapi.webapiName === webapiName) {
            jobId = webapi.id;
        }
    }
    if(jobId == null) {
        printError(`Cannot find running WebAPI with name ${webapiName}`);
        process.exit(-1);
        return;
    }
    const queue = await ensureNotOnComputationNode();
    if(queue === 'hltc00') {
        const command = `qdel ${jobId}`;
        printInfo("executing " + chalk.cyan(command));
        await exec(command);
    }
    else {
        printInfo("killing process tree " + chalk.cyan(jobId));
        process.kill(-jobId);
    }
})();