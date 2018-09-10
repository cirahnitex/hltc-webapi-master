import Job from "../job/Job";
import * as fs from "fs-extra";
import * as listPs from "ps-list";
import {spawn, exec} from "ts-process-promises";
import * as Path from "path";
import {NGINX_CONF_HOME, WEBAPI_CLIENT_HTDOCS_DIR} from "../paths";
import {printInfo} from "../util/consoleStyles";
import delay from "../delay";

function generateFastCgiPass(aJob:Job[]):string {
    let ret = "";
    for(let i=0; i<aJob.length; i++) {
        const job = aJob[i];
        if(!job.isRunning) continue;
        if(job.protocol !== Job.Protocols.FCGI) continue;
        ret += "location /"+job.webapiName+"/ {\n";
        ret += "    include fastcgi.conf;\n";
        ret += "    fastcgi_pass  "+job.host+":"+job.port+";\n";
        ret += "}\n";
    }
    return ret;
}

function generateProxyPass(aJob:Job[]):string {
    let ret = "";
    for(let i=0; i<aJob.length; i++) {
        const job = aJob[i];
        if(!job.isRunning) continue;
        if(job.protocol !== Job.Protocols.HTTP) continue;
        ret += "location /"+job.webapiName+"/ {\n";
        ret += "    proxy_pass  http://"+job.host+":"+job.port+"/;\n";
        ret += "}\n";
    }
    return ret;
}

function generateLogPaths(nginxConfigDir:string) {
    return `
error_log                           ${nginxConfigDir}/cluster_error.log;
pid                                 ${nginxConfigDir}/cluster_nginx.pid;
`;
}

function generateTempPaths(nginxConfigDir:string) {
    return `
client_body_temp_path           ${nginxConfigDir}/tmp/client_body;
fastcgi_temp_path               ${nginxConfigDir}/tmp/fastcgi_temp;
proxy_temp_path                 ${nginxConfigDir}/tmp/proxy_temp;
scgi_temp_path                  ${nginxConfigDir}/tmp/scgi_temp;
uwsgi_temp_path                 ${nginxConfigDir}/tmp/uwsgi_temp;
`;
}

export async function writeProxyConfigFromJobs(nginxConfigDir:string, jobs:Job[]) {
    await Promise.all([fs.outputFile(`${nginxConfigDir}/GENERATED_fastcgi_pass.conf`,generateFastCgiPass(jobs)),
        fs.outputFile(`${nginxConfigDir}/GENERATED_proxy_pass.conf`,generateProxyPass(jobs))]);
}

async function writeLogConfig(nginxConfigDir:string) {
    await Promise.all([fs.outputFile(`${nginxConfigDir}/GENERATED_log_paths.conf`,generateLogPaths(nginxConfigDir)),
        fs.outputFile(`${nginxConfigDir}/GENERATED_temp_paths.conf`,generateTempPaths(nginxConfigDir))]);
    const accessLogContent = `access_log                           ${nginxConfigDir}/cluster_access.log;`;
    await fs.outputFile(`${nginxConfigDir}/GENERATED_access_log_path.conf`, accessLogContent);
}

async function writeGuiRoot(nginxConfigDir:string) {
    const content = `root  ${WEBAPI_CLIENT_HTDOCS_DIR};`;
    await fs.outputFile(`${nginxConfigDir}/GENERATED_gui_root.conf`,content);
}

async function ensureTmpDirs(nginxConfigDir:string) {
    await Promise.all([
        fs.ensureDir(`${nginxConfigDir}/tmp/client_body`),
        fs.ensureDir(`${nginxConfigDir}/tmp/fastcgi_temp`),
        fs.ensureDir(`${nginxConfigDir}/tmp/proxy_temp`),
        fs.ensureDir(`${nginxConfigDir}/tmp/scgi_temp`),
        fs.ensureDir(`${nginxConfigDir}/tmp/uwsgi_temp`),
    ]);
}

export async function startOrRestartNginx(nginxBinPath:string, nginxConfigDir:string) {
    await Promise.all([
        await writeLogConfig(nginxConfigDir),
        writeGuiRoot(nginxConfigDir)
    ]);

    const loggedPid:number|null = await fs.readFile(`${nginxConfigDir}/cluster_nginx.pid`,'utf8').then(str=>parseInt(str.trim())).catch(e=>null);
    if(loggedPid) {
        const psList = await listPs();
        for(const {pid} of psList) {
            if(loggedPid === pid) {
                process.kill(pid, 'SIGHUP');
                await delay(1000);
                return;
            }
        }
    }
    await ensureTmpDirs(nginxConfigDir);
    printInfo(`${nginxBinPath} -c ${Path.join(nginxConfigDir,"cluster_nginx.conf")}`);
    await spawn(`${nginxBinPath}`,["-c",Path.join(nginxConfigDir,"cluster_nginx.conf")],{detached:true});
}

export async function syncNginxWithJobList(nginxBinPath:string, nginxConfigDir:string, jobList:Job[]) {
    await writeProxyConfigFromJobs(nginxConfigDir, jobList);
    await startOrRestartNginx(nginxBinPath, nginxConfigDir);
}