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
const paths_1 = require("../paths");
const ProcessJobManager = require("../job/ProcessJobManager");
const consoleStyles_1 = require("../util/consoleStyles");
const Nginx = require("../nginx/Nginx");
const SGEJobManager = require("../job/SGEJobManager");
const MakeVariables_1 = require("../MakeVariables");
const SGEQueue_1 = require("../job/SGEQueue");
const program = require("commander");
program
    .description("start/restart NGINX")
    .parse(process.argv);
(() => __awaiter(this, void 0, void 0, function* () {
    // use corresponding job manager depending on hltc00 or other local machines
    let JobManager = SGEJobManager;
    const queue = yield SGEQueue_1.ensureNotOnComputationNode();
    if (queue == null) {
        JobManager = ProcessJobManager;
    }
    consoleStyles_1.printInfo("starting NGINX");
    const platformType = (yield MakeVariables_1.getMany(paths_1.DEV, "PLATFORM_TYPE"))[0];
    yield Nginx.syncNginxWithJobList(paths_1.NGINX_BIN(platformType), paths_1.NGINX_CONF_HOME, yield JobManager.listJobs());
    consoleStyles_1.printInfo("done");
}))();
//# sourceMappingURL=reload_nginx.js.map