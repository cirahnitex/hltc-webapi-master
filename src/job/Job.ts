import {FCGI_ENTRY_SCRIPT, HTTP_ENTRY_SCRIPT, INSTALLED_WEBAPIS, WEBAPI_STDERR_LOG, WEBAPI_STDOUT_LOG} from "../paths";
import * as fs from "fs-extra";
import {printInfo} from "../util/consoleStyles";
import chalk from "chalk";

export default class Job {
    id: string = "";
    host: string = "hltc00";
    isRunning: boolean = false;
    protocol: string = "";
    port: number = 0;
    webapiName: string = "";

    static deserializeName(name: string): null | { protocol: string, port: number, webapiName: string } {
        const match = name.match(/^([a-zA-Z0-9]+)_([0-9]+)_(.*)$/);
        if (!match) return null;
        return {
            protocol: match[1],
            port: parseInt(match[2]),
            webapiName: match[3]
        }
    }

    static serializeName(webapiName: string, port: number, protocol: string) {
        return `${protocol}_${port}_${webapiName}`;
    }

    static Protocols = {
        FCGI: 'FCGI',
        HTTP: 'HTTP'
    };
}

export async function getEntryScript(name:string):Promise<null|{path:string,protocol:string}> {
    const fcgiPath = `${INSTALLED_WEBAPIS}/${name}/${FCGI_ENTRY_SCRIPT}`;
    const httpPath = `${INSTALLED_WEBAPIS}/${name}/${HTTP_ENTRY_SCRIPT}`;
    if(await fs.pathExists(fcgiPath)) {
        return {
            path: fcgiPath,
            protocol: Job.Protocols.FCGI,
        }
    }
    if(await fs.pathExists(httpPath)) {
        return {
            path: httpPath,
            protocol: Job.Protocols.HTTP,
        }
    }
    return null;
}

export function generatePortNumber():number {
    return Math.floor(9000 + Math.random()*(65535-9000));
}

export async function clearLog(webapiName:string):Promise<void> {
    console.log(`unlink ${chalk.cyan(`${INSTALLED_WEBAPIS}/${webapiName}/${WEBAPI_STDOUT_LOG}`)}`);
    console.log(`unlink ${chalk.cyan(`${INSTALLED_WEBAPIS}/${webapiName}/${WEBAPI_STDERR_LOG}`)}`);
    await [
        fs.unlink(`${INSTALLED_WEBAPIS}/${webapiName}/${WEBAPI_STDOUT_LOG}`).catch(()=>{}),
        fs.unlink(`${INSTALLED_WEBAPIS}/${webapiName}/${WEBAPI_STDERR_LOG}`).catch(()=>{}),
    ];
}