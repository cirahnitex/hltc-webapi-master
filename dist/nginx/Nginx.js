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
const Job_1 = require("../job/Job");
const fs = require("fs-extra");
const listPs = require("ps-list");
const ts_process_promises_1 = require("ts-process-promises");
const Path = require("path");
const paths_1 = require("../paths");
function generateFastCgiPass(aJob) {
    let ret = "";
    for (let i = 0; i < aJob.length; i++) {
        const job = aJob[i];
        if (!job.isRunning)
            continue;
        if (job.protocol !== Job_1.default.Protocols.FCGI)
            continue;
        ret += "location /" + job.webapiName + "/ {\n";
        ret += "    include fastcgi.conf;\n";
        ret += "    fastcgi_pass  " + job.host + ":" + job.port + ";\n";
        ret += "}\n";
    }
    return ret;
}
function generateProxyPass(aJob) {
    let ret = "";
    for (let i = 0; i < aJob.length; i++) {
        const job = aJob[i];
        if (!job.isRunning)
            continue;
        if (job.protocol !== Job_1.default.Protocols.HTTP)
            continue;
        ret += "location /" + job.webapiName + "/ {\n";
        ret += "    proxy_pass  http://" + job.host + ":" + job.port + "/;\n";
        ret += "}\n";
    }
    return ret;
}
function generateLogPaths(nginxConfigDir) {
    return `
error_log                           ${nginxConfigDir}/cluster_error.log;
pid                                 ${nginxConfigDir}/cluster_nginx.pid;
`;
}
function generateTempPaths(nginxConfigDir) {
    return `
client_body_temp_path           ${nginxConfigDir}/tmp/client_body;
fastcgi_temp_path               ${nginxConfigDir}/tmp/fastcgi_temp;
proxy_temp_path                 ${nginxConfigDir}/tmp/proxy_temp;
scgi_temp_path                  ${nginxConfigDir}/tmp/scgi_temp;
uwsgi_temp_path                 ${nginxConfigDir}/tmp/uwsgi_temp;
`;
}
function writeProxyConfigFromJobs(nginxConfigDir, jobs) {
    return __awaiter(this, void 0, void 0, function* () {
        yield Promise.all([fs.outputFile(`${nginxConfigDir}/GENERATED_fastcgi_pass.conf`, generateFastCgiPass(jobs)),
            fs.outputFile(`${nginxConfigDir}/GENERATED_proxy_pass.conf`, generateProxyPass(jobs))]);
    });
}
exports.writeProxyConfigFromJobs = writeProxyConfigFromJobs;
function writeLogConfig(nginxConfigDir) {
    return __awaiter(this, void 0, void 0, function* () {
        yield Promise.all([fs.outputFile(`${nginxConfigDir}/GENERATED_log_paths.conf`, generateLogPaths(nginxConfigDir)),
            fs.outputFile(`${nginxConfigDir}/GENERATED_temp_paths.conf`, generateTempPaths(nginxConfigDir))]);
    });
}
function writeGuiRoot(nginxConfigDir) {
    return __awaiter(this, void 0, void 0, function* () {
        const content = `root  ${paths_1.WEBAPI_CLIENT_HTDOCS_DIR};`;
        yield fs.outputFile(`${nginxConfigDir}/GENERATED_gui_root.conf`, content);
    });
}
function startOrRestartNginx(nginxBinPath, nginxConfigDir) {
    return __awaiter(this, void 0, void 0, function* () {
        yield Promise.all([
            yield writeLogConfig(nginxConfigDir),
            writeGuiRoot(nginxConfigDir)
        ]);
        const psList = yield listPs();
        let pid = null;
        for (const { pid: iPid, name, cmd } of psList) {
            if (cmd.indexOf("nginx: master process") >= 0) {
                pid = iPid;
                break;
            }
        }
        if (pid == null) {
            yield ts_process_promises_1.spawn(`${nginxBinPath}`, ["-c", Path.join(nginxConfigDir, "cluster_nginx.conf")], { detached: true });
        }
        else {
            process.kill(pid, 'SIGHUP');
        }
    });
}
exports.startOrRestartNginx = startOrRestartNginx;
function syncNginxWithJobList(nginxBinPath, nginxConfigDir, jobList) {
    return __awaiter(this, void 0, void 0, function* () {
        yield writeProxyConfigFromJobs(nginxConfigDir, jobList);
        yield startOrRestartNginx(nginxBinPath, nginxConfigDir);
    });
}
exports.syncNginxWithJobList = syncNginxWithJobList;
//# sourceMappingURL=Nginx.js.map