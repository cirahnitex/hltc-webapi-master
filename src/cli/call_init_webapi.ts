import {call_init_api} from "../startWebapi";
import chalk from "chalk";
import * as program from "commander";
import {exec} from "ts-process-promises";
import {printError} from "../util/consoleStyles";
import listWebapis from "../listWebapis";

program
    .description("start a WebAPI by name")
    .arguments('<webapi-name>')
    .parse(process.argv);

if(process.argv.length !== 3) program.help();
const webapiName = process.argv[2];

(async()=>{
    try {
        const res = await call_init_api(webapiName);
        console.log(res);
    }
    catch(e) {
        console.log(e.message);
    }
})();