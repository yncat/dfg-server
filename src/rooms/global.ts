/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Room, Client } from "colyseus";
import * as dfgmsg from "dfg-messages";
import { isDecodeSuccess } from "../logic/decodeValidator";
import { ChatHandler } from "../logic/chatHandler";
import { PlayerMap } from "../logic/playerMap";
import { createPlayerFromClientOptions } from "../logic/player";
import { GlobalState } from "./schema/global";
import { reportErrorWithDefaultReporter } from "../logic/errorReporter";
import http from "http";
import { createDefaultAuthAdapter } from "../logic/authAdapters";

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
          this.playerMap.clientIDToPlayer(client.id).name
        )
      );
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onAuth(client: Client, options: any, request: http.IncomingMessage): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return createDefaultAuthAdapter().authorize(options);
  }

  onJoin(client: Client, options: any) {
    this.playerMap.add(client.id, createPlayerFromClientOptions(options));
    this.state.playerCount = this.clients.length;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onLeave(client: Client, consented: boolean) {
    this.playerMap.delete(client.id);
  }

  onDispose() {}
}
