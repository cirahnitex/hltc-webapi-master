import {exec} from "ts-process-promises";

export async function getMany(cwd:string, ...varNames:string[]):Promise<string[]> {
    const {stderr, stdout} = await exec(`make ${varNames.map(name=>'print-'+name).join(" ")}`,{cwd: cwd})
        .catch(()=>({stderr:"", stdout:""}));
    const aLine =stdout.trim().split("\n");
    const ret:string[] = [];

    for(const varName of varNames) {
        const pattern = new RegExp(`^${varName}\\s*=\\s*'?([^']*)'?$`);
        let value = "";
        for(const line of aLine) {
            const match = line.match(pattern);
            if(match) {
                value = match[1];
                break;
            }
        }
        ret.push(value);
    }

    return ret;
}

export async function getOne(cwd:string, varName:string):Promise<string> {
    return (await getMany(cwd, varName))[0];
}