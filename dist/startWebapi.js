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
const paths_1 = require("./paths");
const consoleStyles_1 = require("./util/consoleStyles");
const SGEQueue_1 = require("./job/SGEQueue");
const SGEJobManager = require("./job/SGEJobManager");
const ProcessJobManager = require("./job/ProcessJobManager");
const MakeVariables_1 = require("./MakeVariables");
const Nginx = require("./nginx/Nginx");
function start_webapi(name) {
    return __awaiter(this, void 0, void 0, function* () {
        // safety check: don't accept funny stuffs as module name
        if (!name || !name.match(/^[a-zA-Z0-9_.]+$/))
            throw new Error(`Module name malformed. Got "${name}".`);
        // use corresponding job manager depending on hltc00 or other local machines
        let JobManager = SGEJobManager;
        const queue = yield SGEQueue_1.ensureNotOnComputationNode();
        if (queue == null) {
            JobManager = ProcessJobManager;
        }
        // avoid running multiple instances of the same module
        // this behavior may change if we want to run multiple instances and do load balancing in future
        if (yield JobManager.findOneJob({ webapiName: name, isRunning: true })) {
            throw new Error("ALREADY_RUNNING");
        }
        const job = yield JobManager.startJob(name);
        consoleStyles_1.printInfo("starting NGINX");
        const platformType = (yield MakeVariables_1.getMany(paths_1.DEV, "PLATFORM_TYPE"))[0];
        yield Nginx.syncNginxWithJobList(paths_1.NGINX_BIN(platformType), paths_1.NGINX_CONF_HOME, yield JobManager.listJobs());
        consoleStyles_1.printInfo("done");
        return job;
    });
}
exports.default = start_webapi;
//# sourceMappingURL=startWebapi.js.map