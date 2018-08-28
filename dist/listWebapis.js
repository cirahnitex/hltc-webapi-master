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
const fs = require("fs-extra");
const paths_1 = require("./paths");
const SGEQueue_1 = require("./job/SGEQueue");
const SGEJobManager = require("./job/SGEJobManager");
const ProcessJobManager = require("./job/ProcessJobManager");
function default_1() {
    return __awaiter(this, void 0, void 0, function* () {
        let JobManager = SGEJobManager;
        const queue = yield SGEQueue_1.ensureNotOnComputationNode();
        if (queue == null) {
            JobManager = ProcessJobManager;
        }
        const inQueueJobNames = {};
        const jobs = yield JobManager.listJobs();
        jobs.forEach(job => {
            inQueueJobNames[job.webapiName] = true;
        });
        let webapiNames = [];
        try {
            webapiNames = yield fs.readdir(paths_1.INSTALLED_WEBAPIS);
            webapiNames = webapiNames.filter(name => !inQueueJobNames.hasOwnProperty(name));
        }
        catch (e) {
        }
        return { active: jobs, stopped: webapiNames };
    });
}
exports.default = default_1;
;
//# sourceMappingURL=listWebapis.js.map