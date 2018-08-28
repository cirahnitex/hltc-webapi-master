
import installWebapi from "../installWebapi";
import * as program from "commander";

program
    .version("0.1.0")
    .description("build a WebAPI from a normal c++ project. You must specify the hpp file that declares all WebAPI functions you wish to export")
    .arguments('<path-to-hpp>')
    .parse(process.argv);
program.parse(process.argv);

if(process.argv.length!==3) program.help();
installWebapi(process.argv[2]);