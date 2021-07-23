import { Room, Client, ServerError } from "colyseus";
import http from "http";
import * as dfgmsg from "../../msg-src/dfgmsg";

export class GlobalRoom extends Room {
  onCreate(options: any) {
    this.onMessage("chatRequest", (client, request) => {
      const req = dfgmsg.decodeChatRequest(request);
      const msg = dfgmsg.encodeChatMessage("test", req.message);
      this.broadcast("chatMessage", msg);
    });
  }

  onAuth(client: Client, options: any, request: http.IncomingMessage): boolean {
    if (!options.playerName) {
      throw new ServerError(403, "player name is not given");
    }
    return true;
  }

  onJoin(client: Client, options: any) {}

  onLeave(client: Client, consented: boolean) {}

  onDispose() {}
}
