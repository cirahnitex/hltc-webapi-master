import * as Table from "cli-table2";
import chalk from "chalk"

export default function <T>(objs:T[]): string {
    const headersSet:Set<string>  = new Set();
    for(const obj of objs) {
        if(typeof(obj) !== 'object') throw new Error("consoleTable: expect an array of object");
        Object.keys(obj).forEach(key=>headersSet.add(key));
    }
    const headers:string[] = Array.from(headersSet.keys());
    const table = new Table({
        head: headers.map(header=>chalk.cyan(header))
    } as Table.TableConstructorOptions) as string[][];
    for(const obj of objs) {
        table.push(headers.map(key=>obj[key]==null?"":obj[key].toString()))
    }
    return table.toString();
}