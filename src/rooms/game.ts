/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { ArraySchema } from "@colyseus/schema";
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
  gameState: GameState;
  chatHandler: ChatHandler;
  playerMap: PlayerMap;
  ownerClient: Client;
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
    this.state = new GameState();
    this.setState(this.state);
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
      if (client !== this.ownerClient) {
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
      this.state.isInGame = true;
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
    this.playerMap.add(client.id, createPlayerFromClientOptions(options));
    this.state.playerCount = this.clients.length;
    this.updatePlayerNameList();

    if (this.clients.length == 1) {
      // first player in this room will become the room owner
      client.send("RoomOwnerMessage", "");
      this.ownerClient = client;
      const name = this.playerMap.clientIDToPlayer(client.id).name;
      this.editableMetadata.values.owner = name;
      void this.setMetadata(this.editableMetadata.produce());
      this.state.ownerPlayerName = name;
    } else {
      this.broadcast(
        "PlayerJoinedMessage",
        dfgmsg.encodePlayerJoinedMessage(options.playerName)
      );
    }
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
    this.updatePlayerNameList();
    if (client === this.ownerClient) {
      this.handleRoomOwnerSwitch();
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

  private handleRoomOwnerSwitch() {
    if (this.clients.length === 0) {
      return;
    }

    const nextClient = this.clients[0];
    this.ownerClient = nextClient;
    nextClient.send("RoomOwnerMessage", "");
    const name = this.playerMap.clientIDToPlayer(nextClient.id).name;
    this.editableMetadata.values.owner = name;
    void this.setMetadata(this.editableMetadata.produce());
    this.state.ownerPlayerName = name;
  }

  private updatePlayerNameList() {
    // also updates playerCount
    const names = this.clients
      .map((v) => {
        return v.id;
      })
      .map((v) => {
        return this.playerMap.clientIDToPlayer(v).name;
      });
    this.state.playerNameList = new ArraySchema<string>(...names);
    this.state.playerCount = this.clients.length;
  }
}
