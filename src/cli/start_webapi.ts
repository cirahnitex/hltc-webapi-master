import startWebapi from "../startWebapi";
import chalk from "chalk";
import * as program from "commander";
import {exec} from "ts-process-promises";
import {printError} from "../util/consoleStyles";
import listWebapis from "../listWebapis";

program
    .description("start a WebAPI by name")
    .usage('[options] <name>')
    .option('-n, --num-instances [n]', 'number of instances to spawn, default to 1', parseInt)
    .parse(process.argv);


if(program.args.length !== 1) program.help();
const webapiName = program.args[0];
const numInstances = (program.numInstances || 1) as number;

(async()=>{
    const {active, stopped} = await listWebapis();
    for(const webapi of active) {
        if(webapi.webapiName === webapiName) {
            printError(`a WebAPI named ${chalk.cyan(webapiName)} is already running`);
            process.exit(-1);
        }
    }
    if(stopped.indexOf(webapiName)<0) {
        printError(`the WebAPI ${chalk.cyan(webapiName)} is not installed`);
        process.exit(-1);
    }
    try {
        await startWebapi(webapiName, numInstances);
    }
    catch(e) {
        printError(e.message);
    }
})();