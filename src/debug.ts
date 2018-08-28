import {getMany as makeGetVariables} from "./MakeVariables";
(async()=>{
    console.log(await makeGetVariables("/hltc/0/cl/dev/moses_as_a_library","PLATFORM_TYPE","LIBRARY", "ADDITIONAL_INCLUDES","ADDITIONAL_LDFLAGS","ADDITIONAL_CXXFLAGS","ADDITIONAL_LIBRARIES"));
})();
