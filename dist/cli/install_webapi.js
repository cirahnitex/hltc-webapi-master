"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const installWebapi_1 = require("../installWebapi");
const program = require("commander");
const consoleStyles_1 = require("../util/consoleStyles");
program
    .description("build a WebAPI from a normal c++ project. You must specify the hpp file that declares all WebAPI functions you wish to export")
    .arguments('<path-to-hpp>')
    .parse(process.argv);
if (process.argv.length !== 3)
    program.help();
installWebapi_1.default(process.argv[2]).catch(e => consoleStyles_1.printError(e.message));
//# sourceMappingURL=install_webapi.js.map