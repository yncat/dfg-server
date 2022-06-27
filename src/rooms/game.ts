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
import { DiscardPair } from "./schema/discardPair";
import { Card } from "./schema/card";
import { RemovedCardEntry } from "./schema/removedCardEntry";
import { isDecodeSuccess } from "../logic/decodeValidator";
import { catchErrors, catchErrorsAsync } from "../logic/errorReporter";
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
    this.ensureValidRoomCreationOptions(options);
    this.roomOptionsForTest = { skipKickOnLeave: false };
    this.chatHandler = new ChatHandler();
    this.playerMap = new PlayerMap();
    const rp = new RoomProxy<GameRoom>(this);
    this.dfgHandler = new DFGHandler(rp, this.playerMap, options.ruleConfig);
    this.editableMetadata = new EditableMetadata<dfgmsg.GameRoomMetadata>(
      dfgmsg.encodeGameRoomMetadata(
        "",
        dfgmsg.RoomState.WAITING,
        options.ruleConfig,
        []
      )
    );
    this.state = this.prepareState(options);
    this.setState(this.state);
    void this.setMetadata(this.editableMetadata.produce());

    // message handlers
    this.onMessage("ChatRequest", (client, payload) => {
      catchErrors(() => {
        const req = dfgmsg.decodePayload<dfgmsg.ChatRequest>(
          payload,
          dfgmsg.ChatRequestDecoder
        );
        if (!isDecodeSuccess<dfgmsg.ChatRequest>(req)) {
          throw req;
        }
        this.broadcast(
          "ChatMessage",
          this.chatHandler.generateChatMessage(
            req,
            this.playerMap.clientIDToPlayer(client.id).name
          )
        );
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.onMessage("GameStartRequest", (client, payload) => {
      catchErrors(() => {
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
    });

    this.onMessage("CardSelectRequest", (client, payload) => {
      catchErrors(() => {
        if (!this.dfgHandler.isGameActive()) {
          return;
        }
        if (
          this.dfgHandler.activePlayerControl.playerIdentifier !== client.id
        ) {
          return;
        }
        const req = dfgmsg.decodePayload<dfgmsg.CardSelectRequest>(
          payload,
          dfgmsg.CardSelectRequestDecoder
        );
        if (!isDecodeSuccess<dfgmsg.CardSelectRequest>(req)) {
          throw req;
        }

        this.dfgHandler.selectCardByIndex(req.index);
        this.dfgHandler.updateHandForActivePlayer();
        this.dfgHandler.enumerateDiscardPairs();
      });
    });

    this.onMessage("DiscardRequest", (client, payload) => {
      catchErrors(() => {
        if (!this.dfgHandler.isGameActive()) {
          return;
        }
        if (
          this.dfgHandler.activePlayerControl.playerIdentifier !== client.id
        ) {
          return;
        }
        const req = dfgmsg.decodePayload<dfgmsg.DiscardRequest>(
          payload,
          dfgmsg.DiscardRequestDecoder
        );
        if (!isDecodeSuccess<dfgmsg.DiscardRequest>(req)) {
          throw req;
        }

        // 有効なDiscardPairがないときに呼ぶと失敗する。それを検出したら success = false でかえってくるので逃げる。
        if (!this.dfgHandler.discardByIndex(req.index)) {
          return;
        }
        this.dfgHandler.finishAction();
        if (this.dfgHandler.isGameActive()) {
          // 出したプレイヤーの手札を更新
          this.dfgHandler.updateCardsForEveryone();
          this.updateDiscardStackState();
          // カードを出した後、まだゲームが続いていれば、次のプレイヤーに回す処理をする
          this.handleNextPlayer();
        }
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.onMessage("PassRequest", (client, payload) => {
      catchErrors(() => {
        if (!this.dfgHandler.isGameActive()) {
          return;
        }
        if (
          this.dfgHandler.activePlayerControl.playerIdentifier !== client.id
        ) {
          return;
        }

        this.dfgHandler.pass();
        this.dfgHandler.finishAction();
        this.handleNextPlayer();
      });
    });
  }

  onAuth(client: Client, options: any): boolean {
    this.ensureValidRoomParticipationOptions(options);
    return true;
  }

  onJoin(client: Client, options: any) {
    catchErrors(() => {
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
      }
      this.broadcast(
        "PlayerJoinedMessage",
        dfgmsg.encodePlayerJoinedMessage(options.playerName)
      );
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onLeave(client: Client, consented: boolean) {
    catchErrorsAsync(async () => {
      if (consented || !this.dfgHandler.isPlayerInGame(client.id)) {
        this.handlePlayerLeave(client);
        return;
      }
      const p = this.playerMap.clientIDToPlayer(client.id);
      p.markAsDisconnected();
      this.broadcast(
        "PlayerLostMessage",
        dfgmsg.encodePlayerLostMessage(p.name)
      );
      try {
        await this.allowReconnection(client, 60 * dfgmsg.maxReconnectionMinute);
        p.markAsConnected();
        this.broadcast(
          "PlayerReconnectedMessage",
          dfgmsg.encodePlayerReconnectedMessage(p.name)
        );
        this.dfgHandler.handlePlayerReconnect(client.id)
      } catch {
        this.handlePlayerLeave(client);
      }
    });
  }

  public setRoomOptionsForTest(skipKickOnLeave: boolean) {
    this.roomOptionsForTest = { skipKickOnLeave };
  }

  private handlePlayerLeave(client: Client) {
    const name = this.playerMap.clientIDToPlayer(client.id).name;
    this.broadcast("PlayerLeftMessage", dfgmsg.encodePlayerLeftMessage(name));
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
    if (client === this.ownerClient) {
      this.handleRoomOwnerSwitch();
    }
    this.playerMap.delete(client.id);
    this.updatePlayerNameList();
    if (this.dfgHandler.isGameActive()) {
      // When the game ends by the last kick, isGameActive above returns false.
      this.updateRemovedCardsState();
    }
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
    this.editableMetadata.values.playerNameList = names;
    void this.setMetadata(this.editableMetadata.produce());
  }

  private updateDiscardStackState() {
    const stack = new ArraySchema<DiscardPair>();
    const pairs = this.dfgHandler.getLatestDiscardStack().map((v) => {
      const cards = v.cards.map((w) => {
        const c = new Card();
        c.mark = w.mark;
        c.cardNumber = w.cardNumber;
        return c;
      });
      const pair = new DiscardPair();
      pair.cards.push(...cards);
      return pair;
    });
    stack.push(...pairs);
    this.state.discardStack = stack;
  }

  private updateRemovedCardsState() {
    const removedCardList = new ArraySchema<RemovedCardEntry>();
    const entries = this.dfgHandler.getLatestRemovedCards().map((v) => {
      const e = new RemovedCardEntry();
      e.mark = v.mark;
      e.cardNumber = v.cardNumber;
      e.count = v.count;
      return e;
    });
    removedCardList.push(...entries);
    this.state.removedCardList = removedCardList;
  }

  private ensureValidRoomCreationOptions(options: unknown) {
    if (!dfgmsg.isValidGameRoomCreationOptions(options)) {
      throw new dfgmsg.AuthError(
        "Invalid option structure on create",
        dfgmsg.WebSocketErrorCode.UNEXPECTED
      );
    }
  }

  private ensureValidRoomParticipationOptions(options: unknown) {
    if (!dfgmsg.isValidGameRoomParticipationOptions(options)) {
      throw new dfgmsg.AuthError(
        "Invalid option structure on join",
        dfgmsg.WebSocketErrorCode.UNEXPECTED
      );
    }
  }

  private prepareState(options: dfgmsg.GameRoomCreationOptions): GameState {
    const state = new GameState();
    state.ruleConfig.yagiri = options.ruleConfig.yagiri;
    state.ruleConfig.jBack = options.ruleConfig.jBack;
    state.ruleConfig.kakumei = options.ruleConfig.kakumei;
    state.ruleConfig.reverse = options.ruleConfig.reverse;
    state.ruleConfig.skip = options.ruleConfig.skip;
    return state;
  }
}
