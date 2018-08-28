import listWebapi from "../listWebapis";
import chalk from "chalk";
import table from "../util/consoleTable";
(async()=>{
    const list = await listWebapi();
    console.log(chalk.gray("Active WebAPIs"));
    console.log(table(list.active));
    console.log("");
    console.log(chalk.gray("Stopped WebAPIs"));
    console.log(...list.stopped.map(name=>name+' '));
})();
