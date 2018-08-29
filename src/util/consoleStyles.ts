import Chalk, {default as chalk} from "chalk";

export function printInfo(str) {
    console.log(`${chalk.bgCyan.black("INFO")} ${str}`);
}

export function printWarning(str) {
    console.log(`${chalk.bgYellow.black("WARN")} ${str}`);
}

export function printError(str) {
    console.log(`${chalk.bgRed.black("ERR!")} ${str}`);
}