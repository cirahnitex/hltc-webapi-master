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
const MakeVariables_1 = require("./MakeVariables");
(() => __awaiter(this, void 0, void 0, function* () {
    console.log(yield MakeVariables_1.getMany("/hltc/0/cl/dev/moses_as_a_library", "PLATFORM_TYPE", "LIBRARY", "ADDITIONAL_INCLUDES", "ADDITIONAL_LDFLAGS", "ADDITIONAL_CXXFLAGS", "ADDITIONAL_LIBRARIES"));
}))();
//# sourceMappingURL=debug.js.map