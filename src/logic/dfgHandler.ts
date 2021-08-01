import * as dfg from "dfg-simulator";
import { GameState } from "../rooms/schema/game";
import { RoomProxy } from "./roomProxy";
import { CardEnumerator } from "./cardEnumerator";

class GameInactiveError extends Error {}
export class DFGHandler {
  game: dfg.Game | null;
  activePlayerControl: dfg.ActivePlayerControl | null;
  eventReceiver: dfg.EventReceiver;
  roomProxy: RoomProxy<GameState>;
  cardEnumerator: CardEnumerator;
  constructor(roomProxy: RoomProxy<GameState>) {
    this.eventReceiver = new EventReceiver(roomProxy);
    this.roomProxy = roomProxy;
    this.cardEnumerator = new CardEnumerator();
    this.game = null;
  }

  public startGame(clientIDList: string[]) {
    const rc = dfg.createDefaultRuleConfig();
    rc.jBack = true;
    rc.kakumei = true;
    rc.yagiri = true;
    this.game = dfg.createGame(clientIDList, this.eventReceiver, rc);
  }

  public updateCardsForEveryone() {
    if (!this.game) {
      this.gameInactiveError();
    }
    this.game.enumeratePlayerIdentifiers().forEach((v) => {
      const msg = this.cardEnumerator.enumerate(
        this.game.findPlayerByIdentifier(v).hand
      );
      this.roomProxy.send(v, "CardListMessage", msg);
    });
  }

  private gameInactiveError() {
    throw new GameInactiveError("game is inactive");
  }
}

export class EventReceiver implements dfg.EventReceiver {
  roomProxy: RoomProxy<GameState>;
  constructor(roomProxy: RoomProxy<GameState>) {
    this.roomProxy = roomProxy;
  }

  public onNagare(): void {
    console.log("onNagare");
  }

  public onAgari(identifier: string): void {
    console.log("onAgari");
  }

  public onForbiddenAgari(identifier: string): void {
    console.log("onForbiddenAgari");
  }

  public onYagiri(identifier: string): void {
    console.log("onYagiri");
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
