declare module "ps-list" {
    interface ProcessInfo {
        pid: number,
        name: string,
        cmd: string,
        ppid: number,
        cpu: number,
        memory: number
    }
    const exp:()=> Promise<ProcessInfo[]>;
    export = exp;
}
