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
const cp = require("ts-process-promises");
const consoleStyles_1 = require("../util/consoleStyles");
/**
 * get the current SGE queue via executing uname -a
 * @returns {Promise<string | null>} null means hltc00
 */
function getCurrentSgeQueue() {
    return __awaiter(this, void 0, void 0, function* () {
        const { stdout, stderr } = yield cp.exec("uname -a").catch(e => { throw new Error(`cannot get queue, because "uname -a" fail to execute. ${stderr}`); });
        const match = stdout.match(/^Linux hltc([0-9]+)/);
        if (!match) {
            return null;
        }
        const num = parseInt(match[1]);
        if (num == 0) {
            return "hltc00";
        }
        if (num <= 25) {
            return "all.q";
        }
        if (num <= 27) {
            return "centos.q";
        }
        if (num <= 34) {
            return "r430.q";
        }
        if (num <= 35) {
            return "r730.q";
        }
        return null;
    });
}
exports.getCurrentSgeQueue = getCurrentSgeQueue;
function ensureNotOnComputationNode() {
    return __awaiter(this, void 0, void 0, function* () {
        let queue;
        try {
            queue = yield getCurrentSgeQueue();
        }
        catch (e) {
            consoleStyles_1.printError(e.message);
            process.exit(-1);
        }
        if (queue != null && queue != 'hltc00') {
            consoleStyles_1.printError("You must not be in computation node");
            process.exit(-1);
        }
        return queue;
    });
}
exports.ensureNotOnComputationNode = ensureNotOnComputationNode;
//# sourceMappingURL=SGEQueue.js.map