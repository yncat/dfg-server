/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Room, Client } from "colyseus";
import * as dfgmsg from "../../msg-src/dfgmsg";
import { ChatHandler } from "../logic/chatHandler";
import { PlayerMap } from "../logic/playerMap";
import { createPlayerFromClientOptions } from "../logic/player";
import { GameState } from "./schema/game";
import { isDecodeSuccess } from "../logic/decodeValidator";
import { reportErrorWithDefaultReporter } from "../logic/errorReporter";
import { DFGHandler } from "../logic/dfgHandler";
import { RoomProxy } from "../logic/roomProxy";

/* eslint-disable @typescript-eslint/no-unused-vars */
export class GameRoom extends Room<GameState> {
  chatHandler: ChatHandler;
  playerMap: PlayerMap;
  masterClient: Client;
  dfgHandler: DFGHandler;
  onCreate(options: any) {
    /* eslint-enable @typescript-eslint/no-unused-vars */
    this.chatHandler = new ChatHandler();
    this.playerMap = new PlayerMap();
    const rp = new RoomProxy<GameState>(this);
    this.dfgHandler = new DFGHandler(rp, this.playerMap);
    this.setState(new GameState());

    // message handlers
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.onMessage("GameStartRequest", (client, payload) => {
      if (client !== this.masterClient) {
        return;
      }
      if (this.dfgHandler.isGameActive()) {
        return;
      }
      const ids = this.clients.map((v) => {
        return v.id;
      });
      this.dfgHandler.startGame(ids);
      this.dfgHandler.updateCardsForEveryone();
      this.dfgHandler.prepareNextPlayer();
      this.dfgHandler.notifyToActivePlayer();
      this.dfgHandler.updateHandForActivePlayer();
    });

    this.onMessage("CardSelectRequest", (client, payload) => {
      if (!this.dfgHandler.isGameActive()) {
        return;
      }
      if (this.dfgHandler.activePlayerControl.playerIdentifier !== client.id) {
        return;
      }
      const req = dfgmsg.decodePayload<dfgmsg.CardSelectRequest>(
        payload,
        dfgmsg.CardSelectRequestDecoder
      );
      if (!isDecodeSuccess<dfgmsg.CardSelectRequest>(req)) {
        reportErrorWithDefaultReporter(req);
        return;
      }

      this.dfgHandler.selectCardByIndex(req.index);
      this.dfgHandler.updateHandForActivePlayer();
      this.dfgHandler.enumerateDiscardPairs();
    });

    this.onMessage("DiscardRequest", (client, payload) => {
      if (!this.dfgHandler.isGameActive()) {
        return;
      }
      if (this.dfgHandler.activePlayerControl.playerIdentifier !== client.id) {
        return;
      }
      const req = dfgmsg.decodePayload<dfgmsg.DiscardRequest>(
        payload,
        dfgmsg.DiscardRequestDecoder
      );
      if (!isDecodeSuccess<dfgmsg.DiscardRequest>(req)) {
        reportErrorWithDefaultReporter(req);
        return;
      }

      // 有効なDiscardPairがないときに呼ぶと失敗する。それを検出したら success = false でかえってくるので逃げる。
      if (!this.dfgHandler.discardByIndex(req.index)) {
        return;
      }
      this.dfgHandler.finishAction();
    });

    this.onMessage("PassRequest", (client, payload) => {
      if (!this.dfgHandler.isGameActive()) {
        return;
      }
      if (this.dfgHandler.activePlayerControl.playerIdentifier !== client.id) {
        return;
      }

      this.dfgHandler.pass();
      this.dfgHandler.finishAction();
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
    this.playerMap.add(client.id, createPlayerFromClientOptions(options));
    this.state.playerCount = this.clients.length;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onLeave(client: Client, consented: boolean) {
    this.playerMap.delete(client.id);
    if (client === this.masterClient) {
      this.broadcast("MasterDisconnectedMessage", "");
      void this.disconnect();
    }
  }

  onDispose() {}
}
