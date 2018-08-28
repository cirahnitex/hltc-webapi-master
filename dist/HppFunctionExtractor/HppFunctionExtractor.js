"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FuncMeta_1 = require("./FuncMeta");
class Scope {
    constructor() {
        this.name = "";
        this.type = "OTHER";
    }
}
exports.Scope = Scope;
class HppFunctionExtractor {
    constructor() {
        this.packageStack = [];
        this.aFunc = [];
    }
    parse(content) {
        this.packageStack = [];
        this.aFunc = [];
        const packageStack = this.packageStack;
        content.replace(/\s+((((namespace)|(class))\s+([a-zA-Z0-9_]+)\s+)?\{)|(})|(\n\s*(([a-zA-Z_0-9:]+\s+)+)([a-zA-Z_0-9]+)\(([^()]*)\))/g, (match, beginScope, beginScopePrefix, NAMESPACE_or_CLASS, NAMESPACE, CLASS, packageName, endScope, func, funcPrefix, lastFuncPrefix, funcName, signature) => {
            if (beginScope) {
                const scope = new Scope();
                if (NAMESPACE) {
                    scope.name = packageName;
                    scope.type = "NAMESPACE";
                }
                else if (CLASS) {
                    scope.name = packageName;
                    scope.type = "CLASS";
                }
                packageStack.push(scope);
            }
            else if (endScope) {
                const scope = packageStack.pop();
            }
            else if (func) {
                const func = this.parseFunc(funcPrefix, funcName, signature);
                if (func) {
                    this.aFunc.push(func);
                }
            }
            return "";
        });
        return this.aFunc;
    }
    static isReturnTypeValid(returnType) {
        if (!returnType)
            return false;
        for (let i = 0; i < HppFunctionExtractor.VALID_RETURN_TYPES.length; i++) {
            if (returnType.indexOf(HppFunctionExtractor.VALID_RETURN_TYPES[i]) >= 0) {
                return true;
            }
        }
        return false;
    }
    parseFunc(prefixStr, name, signatureStr) {
        if (this.isInClass() && prefixStr.indexOf("static") < 0) {
            return null;
        }
        const returnType = HppFunctionExtractor.getReturnTypeFromPrefix(prefixStr);
        if (!HppFunctionExtractor.isReturnTypeValid(returnType)) {
            return null;
        }
        if (returnType == null)
            return null;
        const ret = new FuncMeta_1.default();
        ret.returnType = returnType;
        ret.name = name;
        ret.qualifiedName = this.getQualifiedName(name);
        // this happens when no parameters in signature.
        if (signatureStr.match(/^\s*$/))
            return ret;
        // split signatures
        const aParamStr = signatureStr.split(',');
        for (let i = 0; i < aParamStr.length; i++) {
            const param = HppFunctionExtractor.parseParamStr(aParamStr[i]);
            if (!param) {
                return null;
            }
            ret.aParam.push(param);
        }
        return ret;
    }
    getQualifiedName(name) {
        let ret = "";
        for (let i = 0; i < this.packageStack.length; i++) {
            if (this.packageStack[i].type === "OTHER")
                continue;
            ret += this.packageStack[i].name + "::";
        }
        ret += name;
        return ret;
    }
    static parseParamStr(paramStr) {
        const match = paramStr.match(/([a-zA-Z0-9_:]+)[\s&]+([a-zA-Z0-9_]+)\s*(=([^=]+))?\s*$/);
        if (!match)
            return null;
        const ret = new FuncMeta_1.Param();
        const type = FuncMeta_1.Param.parseType(match[1]);
        if (!type)
            return null;
        ret.type = type;
        ret.name = match[2];
        ret.defaultValue = match[4] || null;
        return ret;
    }
    static getReturnTypeFromPrefix(prefixStr) {
        const match = prefixStr.match(/([a-zA-Z0-9_:]+)\s+$/);
        if (!match)
            return null;
        return match[1];
    }
    isInClass() {
        if (this.packageStack.length <= 0)
            return false;
        return this.packageStack[this.packageStack.length - 1].type === "CLASS";
    }
}
HppFunctionExtractor.VALID_RETURN_TYPES = ["string", "Json::Value", "int", "double", "void"];
exports.default = HppFunctionExtractor;
//# sourceMappingURL=HppFunctionExtractor.js.map