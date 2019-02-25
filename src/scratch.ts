import * as program from "commander";


program
    .version('0.1.0')
    .usage('[options] <name>')
    .option('-n, --num-instances [n]', 'number of instances to spawn, default to 1', parseInt)
    .parse(process.argv);

console.log(program);