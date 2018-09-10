"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const querystring = require("querystring");
const http = require("http");
function call_init_api() {
    return new Promise((resolve, reject) => {
        // Build the post string from an object
        const post_data = querystring.stringify({
            'format': 'json'
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
        const post_req = http.request(post_options, function (res) {
            res.setEncoding('utf8');
            let data = '';
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on("error", reject);
            res.on("end", () => resolve(data));
        });
        post_req.write(post_data);
        post_req.end();
    });
}
call_init_api().then(r => console.log(r)).catch(e => console.log(e.message));
//# sourceMappingURL=scratch.js.map