import * as cp from "ts-process-promises";
import {printError} from "../util/consoleStyles";
import delay from "../delay";
import * as fs from "fs-extra";
import QStatusParser from "./QStatusParser";
import {QSTATUS} from "../paths";

/**
 * get the current SGE queue via executing uname -a
 * @returns {Promise<string | null>} null means hltc00
 */
export async function getCurrentSgeQueue():Promise<string|null> {
    const {stdout, stderr} = await cp.exec("uname -a").catch(
        e=>{throw new Error(`cannot get queue, because "uname -a" fail to execute. ${stderr}`)}
    );
    const match = stdout.match(/^Linux hltc([0-9]+)/);
    if(!match) {
        return null;
    }
    const num = parseInt(match[1]);
    if(num==0) {
        return "hltc00";
    }
    if(num<=25) {
        return "all.q";
    }
    if(num<=27) {
        return "centos.q";
    }
    if(num<=34) {
        return "r430.q";
    }
    if(num<=35) {
        return "r730.q";
    }
    return null;
}


export async function ensureNotOnComputationNode():Promise<string|null> {
    let queue;
    try {
        queue = await getCurrentSgeQueue();
    }
    catch(e) {
        printError(e.message);
        process.exit(-1);
    }
    if(queue != null && queue != 'hltc00') {
        printError("You must not be in computation node");
        process.exit(-1);
    }
    return queue;
}
