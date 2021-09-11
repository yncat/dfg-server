/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Room, Client } from "colyseus";
import * as dfgmsg from "dfg-messages";
import { ChatHandler } from "../logic/chatHandler";
import { PlayerMap } from "../logic/playerMap";
import { createPlayerFromClientOptions } from "../logic/player";
import { GameState } from "./schema/game";
import { isDecodeSuccess } from "../logic/decodeValidator";
import { reportErrorWithDefaultReporter } from "../logic/errorReporter";
import { DFGHandler } from "../logic/dfgHandler";
import { RoomProxy } from "../logic/roomProxy";
import { EditableMetadata } from "../logic/editableMetadata";

interface RoomOptionsForTest {
  skipKickOnLeave: boolean;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
export class GameRoom extends Room<GameState> {
  chatHandler: ChatHandler;
  playerMap: PlayerMap;
  masterClient: Client;
  dfgHandler: DFGHandler;
  editableMetadata: EditableMetadata<dfgmsg.GameRoomMetadata>;
  roomOptionsForTest: RoomOptionsForTest;
  onCreate(options: any) {
    /* eslint-enable @typescript-eslint/no-unused-vars */
    this.roomOptionsForTest = { skipKickOnLeave: false };
    this.chatHandler = new ChatHandler();
    this.playerMap = new PlayerMap();
    const rp = new RoomProxy<GameRoom>(this);
    this.dfgHandler = new DFGHandler(rp, this.playerMap);
    this.editableMetadata = new EditableMetadata<dfgmsg.GameRoomMetadata>(
      dfgmsg.encodeGameRoomMetadata("", dfgmsg.RoomState.WAITING)
    );
    this.setState(new GameState());
    void this.setMetadata(this.editableMetadata.produce());

    // message handlers
    this.onMessage("ChatRequest", (client, payload) => {
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
      this.editableMetadata.values.roomState = dfgmsg.RoomState.PLAYING;
      void this.setMetadata(this.editableMetadata.produce());
      this.dfgHandler.updateCardsForEveryone();
      this.handleNextPlayer();
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
      if (this.dfgHandler.isGameActive()) {
        // カードを出した後、まだゲームが続いていれば、次のプレイヤーに回す処理をする
        this.handleNextPlayer();
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.onMessage("PassRequest", (client, payload) => {
      if (!this.dfgHandler.isGameActive()) {
        return;
      }
      if (this.dfgHandler.activePlayerControl.playerIdentifier !== client.id) {
        return;
      }

      this.dfgHandler.pass();
      this.dfgHandler.finishAction();
      this.handleNextPlayer();
    });
  }

  onJoin(client: Client, options: any) {
    if (this.clients.length == 1) {
      // first player in this room will become the game master
      client.send("GameMasterMessage", "");
      this.masterClient = client;
      this.editableMetadata.values.owner = options.playerName;
      void this.setMetadata(this.editableMetadata.produce());
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
    if (
      !this.roomOptionsForTest.skipKickOnLeave &&
      this.dfgHandler.isGameActive()
    ) {
      const mustHandleNextPlayer = this.dfgHandler.kickPlayerByIdentifier(
        client.id
      );
      if (mustHandleNextPlayer) {
        this.handleNextPlayer();
      }
    }
    this.playerMap.delete(client.id);
    if (client === this.masterClient) {
      this.handleGameMasterSwitch();
    }
  }

  onDispose() {}

  public setRoomOptionsForTest(skipKickOnLeave: boolean) {
    this.roomOptionsForTest = { skipKickOnLeave };
  }

  private handleNextPlayer() {
    this.dfgHandler.prepareNextPlayer();
    this.dfgHandler.notifyToActivePlayer();
    this.dfgHandler.updateHandForActivePlayer();
  }

  private handleGameMasterSwitch() {
    if (this.clients.length === 0) {
      return;
    }

    const nextClient = this.clients[0];
    this.masterClient = nextClient;
    nextClient.send("GameMasterMessage", "");
    this.editableMetadata.values.owner = this.playerMap.clientIDToPlayer(
      this.masterClient.id
    ).name;
    void this.setMetadata(this.editableMetadata.produce());
  }
}
