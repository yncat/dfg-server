import * as dfg from "dfg-simulator";
import * as dfgmsg from "../../msg-src/dfgmsg";
import { RoomProxy } from "./roomProxy";
import { GameState } from "../rooms/schema/game";
import { PlayerMap } from "./playerMap";

export class EventReceiver implements dfg.EventReceiver {
  roomProxy: RoomProxy<GameState>;
  playerMap: PlayerMap;
  constructor(roomProxy: RoomProxy<GameState>, playerMap: PlayerMap) {
    this.roomProxy = roomProxy;
    this.playerMap = playerMap;
  }

  public onNagare(): void {
    this.roomProxy.broadcast("NagareMessage", "");
  }

  public onAgari(identifier: string): void {
    this.roomProxy.broadcast(
      "AgariMessage",
      dfgmsg.encodeAgariMessage(
        this.playerMap.clientIDToPlayer(identifier).name
      )
    );
  }

  public onForbiddenAgari(identifier: string): void {
    this.roomProxy.broadcast(
      "ForbiddenAgariMessage",
      dfgmsg.encodeForbiddenAgariMessage(
        this.playerMap.clientIDToPlayer(identifier).name
      )
    );
  }

  public onYagiri(identifier: string): void {
    this.roomProxy.broadcast("YagiriMessage", "");
  }

  public onJBack(identifier: string): void {
    console.log("onJBack");
  }

  public onKakumei(identifier: string): void {
    console.log("onKakumei");
  }

  public onStrengthInversion(strengthInverted: boolean): void {
    console.log("onStrengthInverted");
  }

  public onDiscard(identifier: string, discardPair: dfg.DiscardPair): void {
    console.log("onDiscard");
  }

  public onPass(identifier: string): void {
    console.log("onPass");
  }

  public onGameEnd(): void {
    console.log("onGameEnd");
  }

  public onPlayerKicked(identifier: string): void {
    console.log("onPlayerKicked");
  }

  public onPlayerRankChanged(
    identifier: string,
    before: dfg.RankType,
    after: dfg.RankType
  ): void {
    console.log("onPlayerRankChanged");
  }

  public onInitialInfoProvided(playerCount: number, deckCount: number): void {
    console.log("onInitialInfoProvided");
  }

  public onCardsProvided(identifier: string, providedCount: number): void {
    console.log("onCardProvided");
  }
}
