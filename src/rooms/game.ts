/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Room, Client, ServerError } from "colyseus";
import http from "http";
import * as dfgmsg from "../../msg-src/dfgmsg";
import { ChatHandler } from "../logic/chatHandler";
import { PlayerMap } from "../logic/playerMap";
import { GameState } from "./schema/game";
import { isDecodeSuccess } from "../logic/decodeValidator";
import { reportErrorWithDefaultReporter } from "../logic/errorReporter";

export class GameRoom extends Room<GameState> {
  private chatHandler: ChatHandler;
  private playerMap: PlayerMap;
  private masterClient: Client;
  onCreate(options: any) {
    this.chatHandler = new ChatHandler();
    this.setState(new GameState());
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
          this.playerMap.client2player(client)
        )
      );
    });
  }

  onJoin(client: Client, options: any) {
    if (this.clients.length == 1) {
      // first player in this room will become the game master
      client.send("GameMasterMessage", "");
      this.masterClient = client;
    } else {
      this.broadcast(
        "PlayerJoinedMessage",
        dfgmsg.encodePlayerJoinedMessage(options.playerName)
      );
    }
    this.playerMap.add(client, options.playerName);
    this.state.playerCount = this.clients.length;
  }

  onLeave(client: Client, consented: boolean) {
    this.playerMap.delete(client);
    if (client === this.masterClient) {
      this.broadcast("MasterDisconnectedMessage", "");
      void this.disconnect();
    }
  }

  onDispose() {}
}
