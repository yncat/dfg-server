/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Room, Client, ServerError } from "colyseus";
import * as dfgmsg from "../../msg-src/dfgmsg";
import { isDecodeSuccess } from "../logic/decodeValidator";
import { ChatHandler } from "../logic/chatHandler";
import { PlayerMap } from "../logic/playerMap";
import { createPlayerFromClientOptions } from "../logic/player";
import { GlobalState } from "./schema/global";
import { reportErrorWithDefaultReporter } from "../logic/errorReporter";
import http from "http";

export class GlobalRoom extends Room<GlobalState> {
  private chatHandler: ChatHandler;
  private playerMap: PlayerMap;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onCreate(options: any) {
    this.setState(new GlobalState());
    this.chatHandler = new ChatHandler();
    this.playerMap = new PlayerMap();
    this.onMessage("chatRequest", (client, payload) => {
      const req = dfgmsg.decodePayload<dfgmsg.ChatRequest>(
        payload,
        dfgmsg.ChatRequestDecoder
      );
      if (!isDecodeSuccess<dfgmsg.ChatRequest>(req)) {
        reportErrorWithDefaultReporter(req);
        return;
      }
      this.broadcast(
        "ChatMessage",
        this.chatHandler.generateChatMessage(
          req,
          this.playerMap.client2player(client).name
        )
      );
    });
  }

  onAuth(client: Client, options: any, request: http.IncomingMessage): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!options.playerName) {
      return false;
    }
    return true;
  }

  onJoin(client: Client, options: any) {
    this.playerMap.add(client, createPlayerFromClientOptions(options));
    this.state.playerCount = this.clients.length;
  }

  onLeave(client: Client, consented: boolean) {
    this.playerMap.delete(client);
  }

  onDispose() {}
}
