import Chalk, {default as chalk} from "chalk";

export function printInfo(str) {
    console.log(`${chalk.bgCyan.black("INFO")} ${str}`);
}

export function printError(str) {
    console.log(`${chalk.bgRed.black("ERR!")} ${str}`);
}