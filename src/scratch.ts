import * as psList from "ps-list";
import * as Ngx from "./nginx/Nginx";
import {DEV,NGINX_BIN, NGINX_CONF_HOME} from "./paths";
import * as MakeVariables from "./MakeVariables";
import {getMany as makeGetVariables} from "./MakeVariables";
import * as JobManager from "./job/ProcessJobManager";
import * as querystring from "querystring";
import * as http from "http";

function call_init_api() {
    return new Promise((resolve, reject)=>{
        // Build the post string from an object
        const post_data = querystring.stringify({
            'format':'json'
        });

        // An object of options to indicate where to post to
        const post_options = {
            host: 'localhost',
            port: '8792',
            path: `/test/say_hi`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(post_data)
            }
        };

        const post_req = http.request(post_options, function(res) {
            res.setEncoding('utf8');
            let data = '';
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on("error", reject);
            res.on("end", ()=>resolve(data));
        });

        post_req.write(post_data);
        post_req.end();
    });
}
call_init_api().then(r=>console.log(r)).catch(e=>console.log(e.message));