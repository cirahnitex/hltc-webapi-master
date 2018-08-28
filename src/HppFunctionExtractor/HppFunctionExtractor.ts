import FuncMeta, {Param as FnParam} from './FuncMeta';
export class Scope {
    name: string = "";
    type: "OTHER" | "NAMESPACE" | "CLASS" = "OTHER";
}
export default class HppFunctionExtractor {
    packageStack: Scope[] = [];
    aFunc: FuncMeta[] = [];
    static VALID_RETURN_TYPES = ["string", "Json::Value", "int" , "double", "void"];
    parse(content:string): FuncMeta[] {
        this.packageStack = [];
        this.aFunc = [];
        const packageStack = this.packageStack;
        content.replace(/\s+((((namespace)|(class))\s+([a-zA-Z0-9_]+)\s+)?\{)|(})|(\n\s*(([a-zA-Z_0-9:]+\s+)+)([a-zA-Z_0-9]+)\(([^()]*)\))/g,
            (match, beginScope, beginScopePrefix, NAMESPACE_or_CLASS, NAMESPACE, CLASS, packageName, endScope, func, funcPrefix, lastFuncPrefix, funcName, signature):string => {
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
                    if(func) {
                        this.aFunc.push(func);
                    }
                }
                return "";
            });
        return this.aFunc;
    }
    static isReturnTypeValid (returnType:null|string):boolean {
        if(!returnType) return false;
        for (let i = 0; i < HppFunctionExtractor.VALID_RETURN_TYPES.length; i++) {
            if (returnType.indexOf(HppFunctionExtractor.VALID_RETURN_TYPES[i]) >= 0) {
                return true;
            }
        }
        return false;
    }
    parseFunc (prefixStr:string, name:string, signatureStr:string):null|FuncMeta {
        if (this.isInClass() && prefixStr.indexOf("static") < 0) {
            return null;
        }
        const returnType = HppFunctionExtractor.getReturnTypeFromPrefix(prefixStr);
        if(!HppFunctionExtractor.isReturnTypeValid(returnType)) {
            return null;
        }
        if(returnType==null) return null;
        const ret = new FuncMeta();
        ret.returnType = returnType;
        ret.name = name;
        ret.qualifiedName = this.getQualifiedName(name);

        // this happens when no parameters in signature.
        if(signatureStr.match(/^\s*$/)) return ret;

        // split signatures
        const aParamStr = signatureStr.split(',');
        for(let i=0; i<aParamStr.length; i++) {
            const param = HppFunctionExtractor.parseParamStr(aParamStr[i]);
            if(!param) {
                return null;
            }
            ret.aParam.push(param);
        }
        return ret;
    }
    getQualifiedName(name:string):string {
        let ret = "";
        for(let i=0; i<this.packageStack.length; i++) {
            if(this.packageStack[i].type === "OTHER") continue;
            ret += this.packageStack[i].name + "::";
        }
        ret += name;
        return ret;
    }
    static parseParamStr(paramStr:string):null|FnParam {
        const match = paramStr.match(/([a-zA-Z0-9_:]+)[\s&]+([a-zA-Z0-9_]+)\s*(=([^=]+))?\s*$/);
        if(!match) return null;
        const ret = new FnParam();
        const type = FnParam.parseType(match[1]);
        if(!type) return null;
        ret.type = type;
        ret.name = match[2];
        ret.defaultValue = match[4] || null;
        return ret;
    }
    static getReturnTypeFromPrefix(prefixStr:string):null|string {
        const match = prefixStr.match(/([a-zA-Z0-9_:]+)\s+$/);
        if (!match) return null;
        return match[1];
    }
    isInClass() {
        if (this.packageStack.length <= 0) return false;
        return this.packageStack[this.packageStack.length - 1].type === "CLASS";
    }
}

