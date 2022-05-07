import { ArraySchema } from "@colyseus/schema";
import * as dfg from "dfg-simulator";
import { GameRoom } from "../rooms/interface";
import { RoomProxy } from "./roomProxy";
import { PlayerMap } from "./playerMap";
import { CardEnumerator } from "./cardEnumerator";
import * as dfgmsg from "dfg-messages";
import { EventReceiver } from "./eventReceiver";

class InvalidGameStateError extends Error {}
export class DFGHandler {
  game: dfg.Game | null;
  activePlayerControl: dfg.ActivePlayerControl | null;
  eventReceiver: dfg.EventReceiver;
  roomProxy: RoomProxy<GameRoom>;
  playerMap: PlayerMap;
  cardEnumerator: CardEnumerator;
  constructor(roomProxy: RoomProxy<GameRoom>, playerMap: PlayerMap) {
    this.roomProxy = roomProxy;
    this.playerMap = playerMap;
    this.cardEnumerator = new CardEnumerator();
    this.eventReceiver = new EventReceiver(roomProxy, playerMap, () => {
      this.clearCardInfoForEveryone();
      const result = this.game.generateResult();
      const rm = this.roomProxy.roomOrNull();
      if (rm) {
        rm.editableMetadata.values.roomState = dfgmsg.RoomState.WAITING;
        this.roomProxy.setMetadata(rm.editableMetadata.produce());
        rm.state.isInGame = false;
        rm.state.lastGameResult.daifugoPlayerList = new ArraySchema<string>(
          ...this.toPlayerNames(
            result.getIdentifiersByRank(dfg.RankType.DAIFUGO)
          )
        );
        rm.state.lastGameResult.fugoPlayerList = new ArraySchema<string>(
          ...this.toPlayerNames(result.getIdentifiersByRank(dfg.RankType.FUGO))
        );
        rm.state.lastGameResult.heiminPlayerList = new ArraySchema<string>(
          ...this.toPlayerNames(
            result.getIdentifiersByRank(dfg.RankType.HEIMIN)
          )
        );
        rm.state.lastGameResult.hinminPlayerList = new ArraySchema<string>(
          ...this.toPlayerNames(
            result.getIdentifiersByRank(dfg.RankType.HINMIN)
          )
        );
        rm.state.lastGameResult.daihinminPlayerList = new ArraySchema<string>(
          ...this.toPlayerNames(
            result.getIdentifiersByRank(dfg.RankType.DAIHINMIN)
          )
        );
      }
      this.game = null;
    });
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
    this.clearDiscardPairList();
    return true;
  }

  public pass(): void {
    if (!this.activePlayerControl) {
      this.invalidControllerError();
    }

    this.activePlayerControl.pass();
    this.clearDiscardPairList();
  }

  public finishAction(): void {
    if (!this.activePlayerControl) {
      this.invalidControllerError();
    }

    this.game.finishActivePlayerControl(this.activePlayerControl);
  }

  public kickPlayerByIdentifier(identifier: string): boolean {
    // 次のプレイヤーにターンを移さなければいけないとき、trueを返す。
    if (!this.game) {
      this.gameInactiveError();
    }
    if (!this.activePlayerControl) {
      this.invalidControllerError();
    }

    // キックするプレイヤーがゲームに参加中かどうかを確認
    // 観戦者であればゲームからキックする必要はない
    if (!this.game.enumeratePlayerIdentifiers().includes(identifier)) {
      return false;
    }
    let mustHandleNextPlayer =
      identifier === this.activePlayerControl.playerIdentifier; // 現在捜査中のプレイヤーがキックされる場合、次のプレイヤーにターンを回さなければならない
    this.game.kickPlayerByIdentifier(identifier);
    // 残りの人数が二人の時、キックした結果としてゲームが終わっている場合がある。ここでチェックしておかないと、ゲームが終わっているのに次のプレイヤーにターンを回そうとしてエラーが起きる。
    // ちょっとわかりにくいが、eventReceiverのコールバックで、ゲームが終わったら this.game = null が走るようになっているので、 isGameActive で判定すればよい。
    if (!this.isGameActive()) {
      mustHandleNextPlayer = false;
    }
    return mustHandleNextPlayer;
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

  private clearDiscardPairList() {
    // カードを出したプレイヤーのカード候補表示をクリアさせるため、空のDiscardPairListMessageを送って通知する
    this.roomProxy.send(
      this.activePlayerControl.playerIdentifier,
      "DiscardPairListMessage",
      dfgmsg.encodeDiscardPairListMessage([])
    );
  }

  private clearCardInfoForEveryone() {
    // ゲームが終了したら、全ての手札・カード候補表示をクリアする。
    this.roomProxy.broadcast(
      "DiscardPairListMessage",
      dfgmsg.encodeDiscardPairListMessage([])
    );
    this.roomProxy.broadcast(
      "CardListMessage",
      dfgmsg.encodeCardListMessage([])
    );
  }

  private toPlayerNames(ids: Array<string>): Array<string> {
    return ids.map((id) => {
      return this.playerMap.clientIDToPlayer(id).name;
    });
  }
}
