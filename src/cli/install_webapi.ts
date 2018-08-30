
import installWebapi from "../installWebapi";
import * as program from "commander";
import {printError} from "../util/consoleStyles";

program
    .description("build a WebAPI from a normal c++ project. You must specify the hpp file that declares all WebAPI functions you wish to export")
    .arguments('<path-to-hpp>')
    .parse(process.argv);

if(process.argv.length!==3) program.help();
installWebapi(process.argv[2]).catch(e=>printError(e.message));