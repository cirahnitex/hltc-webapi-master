import * as Path from "path";
const CL = Path.normalize(process.env.CL || `/hltc/0/cl`);
export const DEV = Path.normalize(`${CL}/dev`);
export const BRIDGE_HOME = Path.normalize(`${CL}/dev/fastcgi_bridge/src`);
export const BIN_HOME = Path.normalize(`${CL}/dev/fastcgi_bridge/bin`);
export const QSTATUS = Path.normalize(`${CL}/tools/grid/qstatus.sh`);
export const INSTALLED_WEBAPIS = Path.normalize(`${CL}/dev/fastcgi_bridge/installed_webapis`);
export const NGINX_CONF_HOME = Path.normalize(`${__dirname}/../nginx_conf`);
export const WEBAPI_STDOUT_LOG = `stdout.log`;
export const WEBAPI_STDERR_LOG = `stderr.log`;
export const FCGI_ENTRY_SCRIPT = `fcgi.sh`;
export const FCGI_LIB_PATH = (platformType:string, CL:string)=>Path.normalize(`${CL}/dev/opt/fcgi-2.4.1/${platformType}/lib`);
export const HTTP_ENTRY_SCRIPT = `http.sh`;
export const NGINX_BIN = platformType=>Path.normalize(`${CL}/dev/opt/nginx-1.14.0/${platformType}/sbin/nginx`);
export const SPAWN_FCGI_BIN = (platformType:string, CL:string)=>Path.normalize(`${CL}/dev/opt/spawnfcgi/${platformType}/bin/spawn-fcgi`);

export const WEBAPI_CLIENT_HTDOCS_DIR = Path.normalize(`${CL}/dev/webapi_client_htdocs`);