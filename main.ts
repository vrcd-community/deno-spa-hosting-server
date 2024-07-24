import { Handler, Server, File } from 'xserver/mod.ts'

import ServerHeader from "./middleware/serverHeader.ts";
import logRequest from './logger.ts'

const handler = new Handler();

const file = new File();
file.spa(true)
file.path('./public')
file.get('/*', true)
file.head('/*', true)

const serverHeader = new ServerHeader();
serverHeader.any('/*', true)

handler.add(serverHeader)
handler.add(file)

Server((request, info) => {
  logRequest(request, info)

  const requestUrl = new URL(request.url)

  if (request.method === 'GET' && requestUrl.pathname === '/x-server-cgi/trace') {
    return serveTrace(request, info)
  }

  return handler.handle(request)
})

function serveTrace(request: Request, info: Deno.ServeHandlerInfo) {
  return new Response(JSON.stringify({
    poweredBy: "vrcd-deno-spa-hosting-server (https://github.com/vrcd-community/deno-spa-hosting-server) (Powered By xserver (https://github.com/xeaone/server))",
    server: {
      deno: Deno.version.deno || "deno-deploy",
      v8: Deno.version.v8 || "deno-deploy",
      typescript: Deno.version.typescript || "deno-deploy",
    },
    request: {
      url: request.url,
      method: request.method,
      connection: info.remoteAddr,
    },
    timestamp: Date.now(),
  }, null, 2), {
    headers: {
      'server': 'vrcd-deno-spa-hosting-server (https://github.com/vrcd-community/deno-spa-hosting-server) (Powered By xserver (https://github.com/xeaone/server))',
      'content-type': 'application/json',
    }
  })
}