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
const http = require("http");
const querystring = require("querystring");
const delay_1 = require("./delay");
function call_init_api(name) {
    return new Promise((resolve, reject) => {
        // Build the post string from an object
        const post_data = querystring.stringify({
            'format': 'json'
        });
        // An object of options to indicate where to post to
        const post_options = {
            host: 'localhost',
            port: '8792',
            path: `/${name}/init`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(post_data)
            }
        };
        const post_req = http.request(post_options, function (res) {
            res.setEncoding('utf8');
            let data = '';
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on("error", reject);
            res.on("end", () => resolve(data));
        });
        post_req.write(post_data);
        post_req.end();
    });
}
exports.call_init_api = call_init_api;
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
        yield delay_1.default(5000);
        consoleStyles_1.printInfo("calling init function");
        try {
            const res = yield call_init_api(name);
            console.log(res);
        }
        catch (e) {
            console.log(e.message);
        }
        consoleStyles_1.printInfo("done");
        return job;
    });
}
exports.default = start_webapi;
//# sourceMappingURL=startWebapi.js.map