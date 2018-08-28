class IntentedWriter {
    data: string = "";
    depth: number = 0;
    println(line?:string) {
        if(line == null) {
            this.data += '\n';
            return;
        }
        for(let i=0; i<this.depth; i++) {
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

export default IntentedWriter;