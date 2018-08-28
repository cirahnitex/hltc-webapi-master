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
const QStatusParser_1 = require("./QStatusParser");
const paths_1 = require("./paths");
const delay_1 = require("./delay");
const cp = require("ts-process-promises");
const fs = require("fs-extra");
const qParser = new QStatusParser_1.default();
function exec(wd, filename, options) {
    return __awaiter(this, void 0, void 0, function* () {
        // create long random job name, stdin and stdout filename
        const randStem = '_' + Math.random().toString().substr(2);
        const stdoutFilename = randStem + "stdout.log";
        const stdinFilename = randStem + "stderr.log";
        const jobName = randStem;
        // perform a qsub
        yield cp.exec(`qsub -o ${wd}/${stdoutFilename} -e ${wd}/${stdinFilename}${options.queue ? " -q " + options.queue : ""} -N ${jobName} ${filename}`, { cwd: wd });
        // keep checking the qstat until the job is gone
        let i = 0;
        do {
            yield delay_1.default(2000);
            const { stdout, stderr } = yield cp.exec(paths_1.QSTATUS);
            qParser.parse(stdout);
            if (i++ > 30) {
                throw new Error("QSUB_EXEC_TIME_OUT");
            }
        } while (qParser.match({ name: jobName }));
        // ensure that stdout file are there
        i = 0;
        do {
            yield delay_1.default(2000);
            if (i++ > 30) {
                throw new Error("QSUB_EXEC_TIME_OUT");
            }
        } while (!(yield fs.pathExists(`${wd}/${stdoutFilename}`)));
        yield delay_1.default(4000);
        // read stdout and stderr from those file
        let stdout = "";
        let stderr = "";
        try {
            stdout = yield fs.readFile(`${wd}/${stdoutFilename}`, 'utf8');
            yield fs.unlink(`${wd}/${stdoutFilename}`);
        }
        catch (e) {
            console.log(e.message);
        }
        try {
            stderr = yield fs.readFile(`${wd}/${stdinFilename}`, 'utf8');
            yield fs.unlink(`${wd}/${stdinFilename}`);
        }
        catch (e) {
            console.log(e.message);
        }
        return { stdout, stderr };
    });
}
exports.exec = exec;
//# sourceMappingURL=qsub.js.map