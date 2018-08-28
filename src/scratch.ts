import * as psList from "ps-list";
import * as Ngx from "./nginx/Nginx";
import {DEV,NGINX_BIN, NGINX_CONF_HOME} from "./paths";
import * as MakeVariables from "./MakeVariables";
import {getMany as makeGetVariables} from "./MakeVariables";
import * as JobManager from "./job/ProcessJobManager";
(async ()=>{
    console.log(await psList());
})();
