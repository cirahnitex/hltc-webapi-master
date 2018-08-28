"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Param {
    constructor() {
        this.name = "";
        this.type = null;
        this.defaultValue = null;
    }
    static parseType(typeStr) {
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
exports.Param = Param;
class FuncMeta {
    constructor() {
        this.returnType = "";
        this.name = "";
        this.qualifiedName = "";
        this.aParam = [];
    }
    toTableJson() {
        return {
            "API name": this.name,
            "qualified name": this.qualifiedName,
            "params": this.aParam.map(p => p.defaultValue ? `[${p.name}]` : p.name).join(" ")
        };
    }
}
exports.default = FuncMeta;
//# sourceMappingURL=FuncMeta.js.map