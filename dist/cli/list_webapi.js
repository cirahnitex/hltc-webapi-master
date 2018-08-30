"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const listWebapis_1 = require("../listWebapis");
const chalk_1 = require("chalk");
const consoleTable_1 = require("../util/consoleTable");
const program = require("commander");
program
    .description("list all running and stopped WebAPIs")
    .parse(process.argv);
(() => __awaiter(this, void 0, void 0, function* () {
    const list = yield listWebapis_1.default();
    console.log(chalk_1.default.gray("Active WebAPIs"));
    console.log(consoleTable_1.default(list.active));
    console.log("");
    console.log(chalk_1.default.gray("Stopped WebAPIs"));
    console.log(...list.stopped.map(name => name + ' '));
}))();
//# sourceMappingURL=list_webapi.js.map