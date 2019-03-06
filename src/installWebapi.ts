import HppFunctionExtractor from './HppFunctionExtractor/HppFunctionExtractor';
import FuncMeta from "./HppFunctionExtractor/FuncMeta";
const hppFunctionExtractor = new HppFunctionExtractor();

import * as fs from "fs-extra";
import IndentedWriter from "./IndentedWriter";
import {exec, ExecResult} from 'ts-process-promises';
import {DEV, BRIDGE_HOME, BIN_HOME, INSTALLED_WEBAPIS, FCGI_ENTRY_SCRIPT, SPAWN_FCGI_BIN, FCGI_LIB_PATH} from './paths'
import {FuncParamType} from './HppFunctionExtractor/FuncMeta';
import chalk from "chalk";
import table from "./util/consoleTable";
import {printError, printInfo} from "./util/consoleStyles";
import {getMany as makeGetVariables} from "./MakeVariables";
import {getCurrentSgeQueue} from "./job/SGEQueue";

function generateSingleLookupEntry(writer:IndentedWriter, func:FuncMeta) {
    writer.println('ret["'+func.name+'"]=[](const param_adapter& param)->Json::Value {');
    writer.indent();
    if(func.returnType !== "void") {
        writer.println('return param_adapter::to_json('+func.qualifiedName+'(');
    }
    else {
        writer.println(func.qualifiedName+'(');
    }
    if(func.aParam.length > 0) {
        writer.indent();
        const aParamStr:string[] = [];
        for(let i=0; i<func.aParam.length; i++) {
            const param = func.aParam[i];
            const getter = chooseGetterByParamType(param.type);
            if(param.defaultValue == null) {
                aParamStr.push('param.'+getter+'("'+param.name+'")');
            }
            else {
                aParamStr.push('param.'+getter+'("'+param.name+'",'+param.defaultValue+')');
            }
        }
        writer.println(aParamStr.join(','));
        writer.unindent();
    }
    if(func.returnType !== "void") {
        writer.println("));");
    }
    else {
        writer.println(");");
        writer.println("return param_adapter::to_json();");
    }
    writer.unindent();
    writer.println('};');
}
function chooseGetterByParamType(type:FuncParamType):string {
    switch(type) {
        case 'STRING':
            return "get_string";
        case 'INT':
            return "get_int";
        case 'DOUBLE':
            return "get_double";
        case 'A_STRING':
            return "get_a_string";
        case 'MAT_STRING':
            return "get_mat_string";
        case null:
            throw new Error("unknown param type, got null");
        default:
            throw new Error("unknown param type, got '"+type+"'");
    }
}

function generateLookupTable(headerFile:string, aFunc:FuncMeta[]):string {
    const writer = new IndentedWriter();
    writer.println("#ifndef WEBAPI_MASTER_GENERATED_LOOKUP_HPP_HPP");
    writer.println("#define WEBAPI_MASTER_GENERATED_LOOKUP_HPP_HPP");
    writer.println();
    writer.println("#include <functional>");
    writer.println('#include "request.hpp"');
    writer.println('#include <json/value.h>');
    writer.println('#include "'+headerFile+'"');
    writer.println('namespace webapi {');
    writer.indent();
    writer.println("using namespace std;");
    writer.println('typedef map<string, function<Json::Value(const webapi::param_adapter&)>> lookup_table;');
    writer.println('lookup_table create_lookup_table() {');
    writer.indent();
    writer.println('lookup_table ret;');
    for(let i=0; i<aFunc.length; i++) {
        generateSingleLookupEntry(writer, aFunc[i]);
    }
    writer.println('return ret;');
    writer.unindent();
    writer.println("}");
    writer.unindent();
    writer.println("}");
    writer.println('#endif');
    return writer.toString();
}

async function generateMakefile(projectPath:string) {

    const [selfLibrary, additionalIncludes, additionalLdflags, additionalCxxflags, additionalLibraries ] =
        await makeGetVariables(projectPath, "LIBRARY", "ADDITIONAL_INCLUDES","ADDITIONAL_LDFLAGS","ADDITIONAL_CXXFLAGS","ADDITIONAL_LIBRARIES");

    return `ADDITIONAL_INCLUDES += -I${projectPath} ${additionalIncludes}
ADDITIONAL_LDFLAGS += ${additionalLdflags}
ADDITIONAL_CXXFLAGS += ${additionalCxxflags}
ADDITIONAL_LIBRARIES += ${projectPath}/${selfLibrary} ${additionalLibraries}`;
}

async function writeFcgiEntryScript(wd:string, queue:string, platformType:string) {
    const scriptContent = `#!/bin/bash
#$ -S /bin/bash
#$ -V
#$ -q ${queue}
if [ -z "$PLATFORM_TYPE" ]; then
	PLATFORM_TYPE=\`make -f $CL/dev/Makefile echo-PLATFORM_TYPE\`
fi
LD_LIBRARY_PATH=$LD_LIBRARY_PATH:${FCGI_LIB_PATH('$PLATFORM_TYPE', '$CL')}
${SPAWN_FCGI_BIN("$PLATFORM_TYPE",'$CL')} -p $PORT -n $PLATFORM_TYPE/main 
`;
    await fs.writeFile(`${wd}/${FCGI_ENTRY_SCRIPT}`, scriptContent);
    await fs.chmod(`${wd}/${FCGI_ENTRY_SCRIPT}`,'775');
}

async function findMainProgramInDir(dir:string):Promise<null|string> {
    try {
        const subdirs = await fs.readdir(dir);
        if(subdirs.length <= 0) return null;
        const files = await fs.readdir(`${dir}/${subdirs[0]}`);
        if(files.indexOf("main")>=0) return `${dir}/${subdirs[0]}/main`;
    }
    catch(e) {
    }
    return null;
}

export default async function(path:string) {
    let hppContent:string = "";
    try {
        hppContent = await fs.readFile(path, 'utf-8');
    }
    catch(e) {
        printError(`Cannot read file at ${chalk.cyan(path)}`);
        process.exit(-1);
    }

    // detect the current queue
    let queue:string|null;
    try {
        queue = await getCurrentSgeQueue();
        if(queue == 'hltc00') {
            printError(`WebAPI must be installed from a computation node, not hltc00`);
            process.exit(-1);
        }
    }
    catch(e) {
        queue = null;
    }
    printInfo(`SGE Queue: ${chalk.cyan(queue || "unknown")}`);

    const platformType = (await makeGetVariables(DEV, "PLATFORM_TYPE"))[0];

    // extract some info from the path:
    // projectDir - dir path to the project
    // hppFileName - hpp file name
    // projectName - hpp file name without the .hpp suffix
    let [match, projectDir, hppFileName, projectName] = path.match(/^(.*)\/(([a-zA-Z0-9_-]+)\.h(pp)?)$/) as string[];

    // shorten the project name
    // remove the "webapi" or "api" prefix/suffix project name
    // because a webapi is by itself a webapi, there is no point of keeping such prefix/suffix
    projectName = projectName.replace(/_?webapi_?/,"").replace("_api","");
    printInfo(`project name: ${chalk.cyan(projectName)}`);

    const installDirectory = `${INSTALLED_WEBAPIS}/${projectName}/`;
    printInfo(`install to directory: ${chalk.cyan(installDirectory)}`);

    // generate the route lookup table
    printInfo(`finding functions to export from ${path}`);
    const funcs = hppFunctionExtractor.parse(hppContent);

    console.log(table(funcs.map(f=>f.toTableJson())));

    printInfo(`generating lookup table ${BRIDGE_HOME}/GENERATED_LOOKUP.hpp`);
    const lookupTable = generateLookupTable(hppFileName, funcs);
    await fs.writeFile(`${BRIDGE_HOME}/GENERATED_LOOKUP.hpp`,lookupTable);

    // generate the building extra dependencies (will be included by makefile)
    printInfo(`analyzing dependencies from your make file`);
    const makeFileContent = await generateMakefile(projectDir);
    console.log(makeFileContent);
    await fs.writeFile(`${BRIDGE_HOME}/GENERATED_makefile_include`,makeFileContent);

    // empty bin directory so that it will only contain our desired binary after building
    await fs.emptyDir(BIN_HOME);

    printInfo(`compiling`);
    // build fastcgi_bridge project
    await exec("make cleanest",{cwd:BRIDGE_HOME});
    const {stdout, stderr} = await exec("make",{cwd:BRIDGE_HOME});

    // move bin to "installed_webapis"
    const binTargetDir = `${INSTALLED_WEBAPIS}/${projectName}/${platformType}`;
    await fs.ensureDir(binTargetDir);
    const pathToMain = await findMainProgramInDir(BIN_HOME);
    if(!pathToMain) {
        console.log(stdout);
        console.log(stderr);
        printError("compilation failed, exiting");
        process.exit(-1);
    }

    printInfo(`moving binaries to ${binTargetDir}/main`);
    await fs.emptyDir(binTargetDir);
    await fs.move(pathToMain!,`${binTargetDir}/main`);
    await fs.chmod(`${binTargetDir}/main`, '775');

    printInfo(`writing WebAPI job script`);
    // write the fcgi entry script (entry script is the script getting qsub-ed when starting a webapi)
    await writeFcgiEntryScript(`${INSTALLED_WEBAPIS}/${projectName}`, queue || "all.q", platformType);

    return {functions:funcs};
};