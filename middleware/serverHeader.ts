import { Plugin } from "xserver/plugin.ts";
import type Context from "xserver/context.ts";

export default class ServerHeader extends Plugin {
  handle(context: Context): void {
    context.headers.append("Server", "vrcd-deno-spa-hosting-server (https://github.com/vrcd-community/deno-spa-hosting-server) (Powered By xserver (https://github.com/xeaone/server))");
  }
}