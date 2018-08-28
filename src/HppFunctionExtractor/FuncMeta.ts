export type FuncParamType = "MAT_STRING" | "A_STRING" | "STRING" | "INT" | "DOUBLE" | null;
export class Param {
    name: string = "";
    type: FuncParamType = null;
    defaultValue: null|string = null;

    static parseType(typeStr: string): FuncParamType {
        typeStr = typeStr.replace(/std::/g, "");
        if (typeStr.indexOf("vector<vector<string>") >= 0) {
            return "MAT_STRING";
        }
        if (typeStr.indexOf("vector<string>") >= 0) {
            return "A_STRING";
        }
        if (typeStr.indexOf('string') >= 0) {
            return "STRING";
        }
        else if (typeStr.indexOf('int') >= 0) {
            return "INT";
        }
        else if (typeStr.indexOf('double') >= 0) {
            return "DOUBLE";
        }
        return null;
    }
}
export default class FuncMeta {
    returnType: string = "";
    name: string = "";
    qualifiedName: string = "";
    aParam: Param[] = [];
    toTableJson():{"API name":string,"qualified name":string, "params":string} {
        return {
            "API name":this.name,
            "qualified name":this.qualifiedName,
            "params":this.aParam.map(p=>p.defaultValue?`[${p.name}]`:p.name).join(" ")
        }
    }
}
