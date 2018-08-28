"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class IntentedWriter {
    constructor() {
        this.data = "";
        this.depth = 0;
    }
    println(line) {
        if (line == null) {
            this.data += '\n';
            return;
        }
        for (let i = 0; i < this.depth; i++) {
            this.data += '  ';
        }
        this.data += line;
        this.data += "\n";
    }
    indent() {
        this.depth++;
    }
    unindent() {
        this.depth--;
    }
    toString() {
        return this.data;
    }
}
exports.default = IntentedWriter;
//# sourceMappingURL=IndentedWriter.js.map