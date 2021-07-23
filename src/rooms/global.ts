import { Room, Client, ServerError } from "colyseus";
import http from "http";
import * as dfgmsg from "../../msg-src/dfgmsg";
import { isDecodeSuccess } from "../logic/decodeValidator";
import { ChatHandler } from "../logic/chatHandler";
import { PlayerMap } from "../logic/playerMap";

export class GlobalRoom extends Room {
  private chatHandler: ChatHandler;
  private playerMap: PlayerMap;
  onCreate(options: any) {
    this.chatHandler = new ChatHandler();
    this.playerMap = new PlayerMap();
    this.onMessage("chatRequest", (client, payload) => {
      const req = dfgmsg.decodePayload<dfgmsg.ChatRequest>(
        payload,
        dfgmsg.ChatRequestDecoder
      );
      if (!isDecodeSuccess<dfgmsg.ChatRequest>(req)) {
        return;
      }
      this.broadcast(
        "chatMessage",
        this.chatHandler.generateChatMessage(
          req,
          this.playerMap.client2player(client)
        )
      );
    });
  }

  onAuth(client: Client, options: any, request: http.IncomingMessage): boolean {
    if (!options.playerName) {
      throw new ServerError(403, "player name is not given");
    }
    return true;
  }

  onJoin(client: Client, options: any) {
    this.playerMap.add(client, options.playerName);
  }

  onLeave(client: Client, consented: boolean) {
    this.playerMap.delete(client);
  }

  onDispose() {}
}
