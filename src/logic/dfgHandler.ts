import * as dfg from "dfg-simulator";
import { GameState } from "../rooms/schema/game";
import { RoomProxy } from "./roomProxy";
import { PlayerMap } from "./playerMap";
import { CardEnumerator } from "./cardEnumerator";
import * as dfgmsg from "../../msg-src/dfgmsg";

class InvalidGameStateError extends Error {}
export class DFGHandler {
  game: dfg.Game | null;
  activePlayerControl: dfg.ActivePlayerControl | null;
  eventReceiver: dfg.EventReceiver;
  roomProxy: RoomProxy<GameState>;
  playerMap: PlayerMap;
  cardEnumerator: CardEnumerator;
  constructor(roomProxy: RoomProxy<GameState>, playerMap: PlayerMap) {
    this.eventReceiver = new EventReceiver(roomProxy);
    this.roomProxy = roomProxy;
    this.playerMap = playerMap;
    this.cardEnumerator = new CardEnumerator();
    this.game = null;
  }

  public startGame(clientIDList: string[]) {
    const rc = dfg.createDefaultRuleConfig();
    rc.jBack = true;
    rc.kakumei = true;
    rc.yagiri = true;
    this.game = this.createGame(clientIDList, this.eventReceiver, rc);
  }

  public updateCardsForEveryone() {
    if (!this.game) {
      this.gameInactiveError();
    }
    this.game.enumeratePlayerIdentifiers().forEach((v) => {
      const msg = this.cardEnumerator.enumerateFromHand(
        this.game.findPlayerByIdentifier(v).hand
      );
      this.roomProxy.send(v, "CardListMessage", msg);
    });
  }

  public prepareNextPlayer() {
    if (!this.game) {
      this.gameInactiveError();
    }
    this.activePlayerControl = this.game.startActivePlayerControl();
    const pn = this.playerMap.clientIDToPlayer(
      this.activePlayerControl.playerIdentifier
    ).name;
    const msg = dfgmsg.encodeTurnMessage(pn);
    this.roomProxy.broadcast("TurnMessage", msg);
  }

  public notifyToActivePlayer() {
    if (!this.activePlayerControl) {
      this.invalidControllerError();
    }
    this.roomProxy.send(
      this.activePlayerControl.playerIdentifier,
      "YourTurnMessage",
      ""
    );
  }

  public updateHandForActivePlayer() {
    if (!this.activePlayerControl) {
      this.invalidControllerError();
    }
    this.roomProxy.send(
      this.activePlayerControl.playerIdentifier,
      "CardListMessage",
      this.cardEnumerator.enumerateFromActivePlayerControl(
        this.activePlayerControl
      )
    );
  }

  public selectCardByIndex(index: number) {
    if (!this.activePlayerControl) {
      this.invalidControllerError();
    }

    if (
      this.activePlayerControl.checkCardSelectability(index) ===
      dfg.SelectabilityCheckResult.NOT_SELECTABLE
    ) {
      return;
    }

    if (this.activePlayerControl.isCardSelected(index)) {
      this.activePlayerControl.deselectCard(index);
      return;
    }
    this.activePlayerControl.selectCard(index);
  }

  public enumerateDiscardPairs() {
    if (!this.activePlayerControl) {
      this.invalidControllerError();
    }
    this.roomProxy.send(
      this.activePlayerControl.playerIdentifier,
      "DiscardPairListMessage",
      dfgmsg.encodeDiscardPairListMessage(
        this.activePlayerControl.enumerateDiscardPairs().map((v) => {
          return dfgmsg.encodeDiscardPairMessage(
            v.cards.map((w) => {
              return dfgmsg.encodeCardMessage(w.mark, w.cardNumber);
            })
          );
        })
      )
    );
  }

  private gameInactiveError() {
    throw new InvalidGameStateError("game is inactive");
  }

  private invalidControllerError() {
    throw new InvalidGameStateError("active player control is invalid");
  }

  private createGame(
    clientIDList: string[],
    eventReceiver: dfg.EventReceiver,
    ruleConfig: dfg.RuleConfig
  ) {
    return dfg.createGame(clientIDList, eventReceiver, ruleConfig);
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
