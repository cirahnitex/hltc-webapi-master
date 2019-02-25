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
    let jobIds:string[] = [];
    for(const webapi of active) {
        if(webapi.webapiName === webapiName) {
            jobIds.push( webapi.id);
        }
    }
    if(jobIds.length<=0) {
        printError(`Cannot find running WebAPI with name ${webapiName}`);
        process.exit(-1);
        return;
    }
    const queue = await ensureNotOnComputationNode();
    if(queue === 'hltc00') {
        for(const jobId of jobIds) {
            const command = `qdel ${jobId}`;
            printInfo("executing " + chalk.cyan(command));
            await exec(command);
        }
    }
    else {
        for(const jobId of jobIds) {
            printInfo("killing process tree " + chalk.cyan(jobId));
            process.kill(parseInt(jobId));
        }
    }
})();