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
const HppFunctionExtractor_1 = require("./HppFunctionExtractor/HppFunctionExtractor");
const hppFunctionExtractor = new HppFunctionExtractor_1.default();
const fs = require("fs-extra");
const IndentedWriter_1 = require("./IndentedWriter");
const ts_process_promises_1 = require("ts-process-promises");
const paths_1 = require("./paths");
const chalk_1 = require("chalk");
const consoleTable_1 = require("./util/consoleTable");
const consoleStyles_1 = require("./util/consoleStyles");
const MakeVariables_1 = require("./MakeVariables");
const SGEQueue_1 = require("./job/SGEQueue");
function generateSingleLookupEntry(writer, func) {
    writer.println('ret["' + func.name + '"]=[](const param_adapter& param)->Json::Value {');
    writer.indent();
    if (func.returnType !== "void") {
        writer.println('return param_adapter::to_json(' + func.qualifiedName + '(');
    }
    else {
        writer.println(func.qualifiedName + '(');
    }
    if (func.aParam.length > 0) {
        writer.indent();
        const aParamStr = [];
        for (let i = 0; i < func.aParam.length; i++) {
            const param = func.aParam[i];
            const getter = chooseGetterByParamType(param.type);
            if (param.defaultValue == null) {
                aParamStr.push('param.' + getter + '("' + param.name + '")');
            }
            else {
                aParamStr.push('param.' + getter + '("' + param.name + '",' + param.defaultValue + ')');
            }
        }
        writer.println(aParamStr.join(','));
        writer.unindent();
    }
    if (func.returnType !== "void") {
        writer.println("));");
    }
    else {
        writer.println(");");
        writer.println("return param_adapter::to_json();");
    }
    writer.unindent();
    writer.println('};');
}
function chooseGetterByParamType(type) {
    switch (type) {
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
            throw new Error("unknown param type, got '" + type + "'");
    }
}
function generateLookupTable(headerFile, aFunc) {
    const writer = new IndentedWriter_1.default();
    writer.println("#ifndef WEBAPI_MASTER_GENERATED_LOOKUP_HPP_HPP");
    writer.println("#define WEBAPI_MASTER_GENERATED_LOOKUP_HPP_HPP");
    writer.println();
    writer.println("#include <functional>");
    writer.println('#include "request.hpp"');
    writer.println('#include <json/value.h>');
    writer.println('#include "' + headerFile + '"');
    writer.println('namespace webapi {');
    writer.indent();
    writer.println("using namespace std;");
    writer.println('typedef map<string, function<Json::Value(const webapi::param_adapter&)>> lookup_table;');
    writer.println('lookup_table create_lookup_table() {');
    writer.indent();
    writer.println('lookup_table ret;');
    for (let i = 0; i < aFunc.length; i++) {
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
function generateMakefile(projectPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const [selfLibrary, additionalIncludes, additionalLdflags, additionalCxxflags, additionalLibraries] = yield MakeVariables_1.getMany(projectPath, "LIBRARY", "ADDITIONAL_INCLUDES", "ADDITIONAL_LDFLAGS", "ADDITIONAL_CXXFLAGS", "ADDITIONAL_LIBRARIES");
        return `ADDITIONAL_INCLUDES += -I${projectPath} ${additionalIncludes}
ADDITIONAL_LDFLAGS += ${additionalLdflags}
ADDITIONAL_CXXFLAGS += ${additionalCxxflags}
ADDITIONAL_LIBRARIES += ${projectPath}/${selfLibrary} ${additionalLibraries}`;
    });
}
function writeFcgiEntryScript(wd, queue, platformType) {
    return __awaiter(this, void 0, void 0, function* () {
        const scriptContent = `#!/bin/bash
#$ -S /bin/bash
#$ -V
#$ -q ${queue}
if [ -z "$PLATFORM_TYPE" ]; then
	PLATFORM_TYPE=\`make -f $CL/dev/Makefile echo-PLATFORM_TYPE\`
fi
LD_LIBRARY_PATH=$LD_LIBRATY_PATH:${paths_1.FCGI_LIB_PATH('$PLATFORM_TYPE', '$CL')}
${paths_1.SPAWN_FCGI_BIN("$PLATFORM_TYPE", '$CL')} -p $PORT -n $PLATFORM_TYPE/main 
`;
        yield fs.writeFile(`${wd}/${paths_1.FCGI_ENTRY_SCRIPT}`, scriptContent);
        yield fs.chmod(`${wd}/${paths_1.FCGI_ENTRY_SCRIPT}`, '775');
    });
}
function findMainProgramInDir(dir) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const subdirs = yield fs.readdir(dir);
            if (subdirs.length <= 0)
                return null;
            const files = yield fs.readdir(`${dir}/${subdirs[0]}`);
            if (files.indexOf("main") >= 0)
                return `${dir}/${subdirs[0]}/main`;
        }
        catch (e) {
        }
        return null;
    });
}
function default_1(path) {
    return __awaiter(this, void 0, void 0, function* () {
        let hppContent = "";
        try {
            hppContent = yield fs.readFile(path, 'utf-8');
        }
        catch (e) {
            consoleStyles_1.printError(`Cannot read file at ${chalk_1.default.cyan(path)}`);
            process.exit(-1);
        }
        // detect the current queue
        let queue;
        try {
            queue = yield SGEQueue_1.getCurrentSgeQueue();
            if (queue == 'hltc00') {
                consoleStyles_1.printError(`WebAPI must be installed from a computation node, not hltc00`);
                process.exit(-1);
            }
        }
        catch (e) {
            queue = null;
        }
        consoleStyles_1.printInfo(`SGE Queue: ${chalk_1.default.cyan(queue || "unknown")}`);
        const platformType = (yield MakeVariables_1.getMany(paths_1.DEV, "PLATFORM_TYPE"))[0];
        // extract some info from the path:
        // projectDir - dir path to the project
        // hppFileName - hpp file name
        // projectName - hpp file name without the .hpp suffix
        let [match, projectDir, hppFileName, projectName] = path.match(/^(.*)\/(([a-zA-Z0-9_-]+)\.h(pp)?)$/);
        // remove the "webapi" or "api" prefix/suffix project name
        // because a webapi is by itself a webapi, there is no point of keeping such prefix/suffix
        projectName = projectName.replace(/_?webapi_?/, "").replace("_api", "");
        consoleStyles_1.printInfo(`project name: ${chalk_1.default.cyan(projectName)}`);
        const installDirectory = `${paths_1.INSTALLED_WEBAPIS}/${projectName}/`;
        consoleStyles_1.printInfo(`install to directory: ${chalk_1.default.cyan(installDirectory)}`);
        // generate the route lookup table
        consoleStyles_1.printInfo(`finding functions to export from ${path}`);
        const funcs = hppFunctionExtractor.parse(hppContent);
        console.log(consoleTable_1.default(funcs.map(f => f.toTableJson())));
        consoleStyles_1.printInfo(`generating lookup table ${paths_1.BRIDGE_HOME}/GENERATED_LOOKUP.hpp`);
        const lookupTable = generateLookupTable(hppFileName, funcs);
        yield fs.writeFile(`${paths_1.BRIDGE_HOME}/GENERATED_LOOKUP.hpp`, lookupTable);
        // generate the building extra dependencies (will be included by makefile)
        consoleStyles_1.printInfo(`analyzing dependencies from your make file`);
        const makeFileContent = yield generateMakefile(projectDir);
        console.log(makeFileContent);
        yield fs.writeFile(`${paths_1.BRIDGE_HOME}/GENERATED_makefile_include`, makeFileContent);
        // empty bin directory so that it will only contain our desired binary after building
        yield fs.emptyDir(paths_1.BIN_HOME);
        consoleStyles_1.printInfo(`compiling`);
        // build fastcgi_bridge project
        yield ts_process_promises_1.exec("make clean", { cwd: paths_1.BRIDGE_HOME });
        const { stdout, stderr } = yield ts_process_promises_1.exec("make", { cwd: paths_1.BRIDGE_HOME });
        // move bin to "installed_webapis"
        const binTargetDir = `${paths_1.INSTALLED_WEBAPIS}/${projectName}/${platformType}`;
        yield fs.ensureDir(binTargetDir);
        const pathToMain = yield findMainProgramInDir(paths_1.BIN_HOME);
        if (!pathToMain) {
            console.log(stdout);
            console.log(stderr);
            consoleStyles_1.printError("compilation failed, exiting");
            process.exit(-1);
        }
        consoleStyles_1.printInfo(`moving binaries to ${binTargetDir}/main`);
        yield fs.emptyDir(binTargetDir);
        yield fs.move(pathToMain, `${binTargetDir}/main`);
        yield fs.chmod(`${binTargetDir}/main`, '775');
        consoleStyles_1.printInfo(`writing WebAPI job script`);
        // write the fcgi entry script (entry script is the script getting qsub-ed when starting a webapi)
        yield writeFcgiEntryScript(`${paths_1.INSTALLED_WEBAPIS}/${projectName}`, queue || "all.q", platformType);
        return { functions: funcs };
    });
}
exports.default = default_1;
;
//# sourceMappingURL=installWebapi.js.map