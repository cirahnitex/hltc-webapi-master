"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Path = require("path");
const CL = Path.normalize(process.env.CL || `/hltc/0/cl`);
exports.DEV = Path.normalize(`${CL}/dev`);
exports.BRIDGE_HOME = Path.normalize(`${CL}/dev/fastcgi_bridge/src`);
exports.BIN_HOME = Path.normalize(`${CL}/dev/fastcgi_bridge/bin`);
exports.QSTATUS = Path.normalize(`${CL}/tools/grid/qstatus.sh`);
exports.INSTALLED_WEBAPIS = Path.normalize(`${CL}/dev/fastcgi_bridge/installed_webapis`);
exports.NGINX_CONF_HOME = Path.normalize(`${__dirname}/../nginx_conf`);
exports.WEBAPI_STDOUT_LOG = `_stdout.log`;
exports.WEBAPI_STDERR_LOG = `_stderr.log`;
exports.FCGI_ENTRY_SCRIPT = `fcgi.sh`;
exports.FCGI_LIB_PATH = (platformType, CL) => Path.normalize(`${CL}/dev/opt/fcgi-2.4.1/${platformType}/lib`);
exports.HTTP_ENTRY_SCRIPT = `http.sh`;
exports.NGINX_BIN = platformType => Path.normalize(`${CL}/dev/opt/nginx-1.14.0/${platformType}/sbin/nginx`);
exports.SPAWN_FCGI_BIN = (platformType, CL) => Path.normalize(`${CL}/dev/opt/spawnfcgi/${platformType}/bin/spawn-fcgi`);
exports.WEBAPI_CLIENT_HTDOCS_DIR = Path.normalize(`${CL}/dev/webapi_client_htdocs`);
//# sourceMappingURL=paths.js.map