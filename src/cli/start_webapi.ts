import startWebapi from "../startWebapi";
import chalk from "chalk";
import * as program from "commander";
import {exec} from "ts-process-promises";
import {printError} from "../util/consoleStyles";
import listWebapis from "../listWebapis";


program
    .version("0.1.0")
    .description("start a WebAPI by name")
    .command(`<webapi-name>`)
    .parse(process.argv);


if(process.argv.length !== 3) program.help();
const webapiName = process.argv[2];

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
    await startWebapi(webapiName);
})();