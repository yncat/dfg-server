import * as dfg from "dfg-simulator";
import { GameState } from "../rooms/schema/game";
import { RoomProxy } from "./roomProxy";
import { PlayerMap } from "./playerMap";
import { CardEnumerator } from "./cardEnumerator";
import * as dfgmsg from "../../msg-src/dfgmsg";
import { EventReceiver } from "./eventReceiver";

class InvalidGameStateError extends Error {}
export class DFGHandler {
  game: dfg.Game | null;
  activePlayerControl: dfg.ActivePlayerControl | null;
  eventReceiver: dfg.EventReceiver;
  roomProxy: RoomProxy<GameState>;
  playerMap: PlayerMap;
  cardEnumerator: CardEnumerator;
  constructor(roomProxy: RoomProxy<GameState>, playerMap: PlayerMap) {
    this.eventReceiver = new EventReceiver(roomProxy, playerMap);
    this.roomProxy = roomProxy;
    this.playerMap = playerMap;
    this.cardEnumerator = new CardEnumerator();
    this.game = null;
  }

  public startGame(clientIDList: string[]): void {
    const rc = dfg.createDefaultRuleConfig();
    rc.jBack = true;
    rc.kakumei = true;
    rc.yagiri = true;
    this.game = this.createGame(clientIDList, this.eventReceiver, rc);
  }

  public isGameActive(): boolean {
    return this.game ? true : false;
  }

  public updateCardsForEveryone(): void {
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

  public prepareNextPlayer(): void {
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

  public notifyToActivePlayer(): void {
    if (!this.activePlayerControl) {
      this.invalidControllerError();
    }
    this.roomProxy.send(
      this.activePlayerControl.playerIdentifier,
      "YourTurnMessage",
      ""
    );
  }

  public updateHandForActivePlayer(): void {
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

  public selectCardByIndex(index: number): void {
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

  public enumerateDiscardPairs(): void {
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

  public discardByIndex(index: number): boolean {
    // 有効なDiscardPairがないときに呼ぶと、 false を返すようにする。タイミング問題で変なメッセージが送られても、落ちる前に逃げるようにするため。
    if (!this.activePlayerControl) {
      this.invalidControllerError();
    }
    if (index < 0) {
      return;
    }
    const dps = this.activePlayerControl.enumerateDiscardPairs();
    if (index >= dps.length) {
      return false;
    }

    this.activePlayerControl.discard(dps[index]);
    return true;
  }

  public pass(): void {
    if (!this.activePlayerControl) {
      this.invalidControllerError();
    }

    this.activePlayerControl.pass();
  }

  public finishAction(): void {
    if (!this.activePlayerControl) {
      this.invalidControllerError();
    }

    this.game.finishActivePlayerControl(this.activePlayerControl);
  }

  public kickPlayerByIdentifier(identifier: string): void {
    if (!this.game) {
      this.gameInactiveError();
    }

    this.game.kickPlayerByIdentifier(identifier);
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
