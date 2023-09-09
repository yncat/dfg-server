import { ArraySchema } from "@colyseus/schema";
import * as dfg from "dfg-simulator";
import { GameRoom } from "../rooms/interface";
import { RoomProxy } from "./roomProxy";
import { PlayerMap } from "./playerMap";
import { CardEnumerator } from "./cardEnumerator";
import * as dfgmsg from "dfg-messages";
import { EventReceiver, EventReceiverCallbacks } from "./eventReceiver";

class InvalidGameStateError extends Error { }
export type OnEventLogPushFunc = (eventType: string, eventBody: string) => void;

export class DFGHandler {
  ruleConfig: dfg.RuleConfig;
  game: dfg.Game | null;
  activePlayerControl: dfg.ActivePlayerControl | null;
  additionalActionControl: dfg.AdditionalActionControl | null;
  eventReceiver: dfg.EventReceiver;
  roomProxy: RoomProxy<GameRoom>;
  playerMap: PlayerMap;
  cardEnumerator: CardEnumerator;
  onEventLogPush: OnEventLogPushFunc;
  constructor(
    roomProxy: RoomProxy<GameRoom>,
    playerMap: PlayerMap,
    ruleConfig: dfgmsg.RuleConfig,
    onEventLogPush: OnEventLogPushFunc
  ) {
    // set rule config
    const r = dfg.createDefaultRuleConfig();
    r.yagiri = ruleConfig.yagiri;
    r.jBack = ruleConfig.jBack;
    r.kakumei = ruleConfig.kakumei;
    r.reverse = ruleConfig.reverse;
    r.skip = ruleConfig.skip;
    r.transfer7 = ruleConfig.transfer;
    r.exile10 = ruleConfig.exile;
    this.ruleConfig = r;

    // set other constructor values
    this.roomProxy = roomProxy;
    this.playerMap = playerMap;
    this.cardEnumerator = new CardEnumerator();
    this.game = null;
    this.onEventLogPush = onEventLogPush;

    // callback function which is called on game end
    const onGameEnd = () => {
      this.clearCardInfoForEveryone();
      this.game.enumeratePlayerIdentifiers().forEach((id) => {
        this.roomProxy.send(
          id,
          "PreventCloseMessage",
          dfgmsg.encodePreventCloseMessage(false)
        );
      });
      const result = this.game.outputResult();
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
        rm.state.removedCardList.clear();
        rm.state.discardStack.clear();
      }
      this.game = null;
    };

    // setup event receiver with callbacks
    const clbks: EventReceiverCallbacks = {
      onGameEnd: onGameEnd,
      onEventLogPush: onEventLogPush,
    };
    this.eventReceiver = new EventReceiver(playerMap, clbks);
  }

  public startGame(clientIDList: string[]): void {
    this.game = this.createGame(
      clientIDList,
      this.eventReceiver,
      this.ruleConfig
    );
    clientIDList.forEach((id) => {
      this.roomProxy.send(
        id,
        "PreventCloseMessage",
        dfgmsg.encodePreventCloseMessage(true)
      );
    });
  }

  public isGameActive(): boolean {
    return this.game ? true : false;
  }

  public getActivePlayerIdentifier(): string {
    if (!this.activePlayerControl && !this.additionalActionControl) {
      throw new InvalidGameStateError(
        "activePlayerControl and additionalActionControl are both null."
      );
    }
    return this.activePlayerControl
      ? this.activePlayerControl.playerIdentifier
      : this.additionalActionControl.playerIdentifier;
  }

  public updateCardsForEveryone(): void {
    if (!this.game) {
      this.gameInactiveError();
    }
    this.game.enumeratePlayerIdentifiers().forEach((v) => {
      const e =
        this.activePlayerControl &&
          this.activePlayerControl.playerIdentifier === v
          ? this.cardEnumerator.enumerateFromActivePlayerControl(
            this.activePlayerControl
          )
          : this.cardEnumerator.enumerateFromHand(
            this.game.findPlayerByIdentifier(v).hand
          );
      this.roomProxy.send(v, "CardListMessage", e);
    });
  }

  public prepareNextPlayer(): void {
    if (!this.game) {
      this.gameInactiveError();
    }
    this.activePlayerControl = this.game.startActivePlayerControl();
    const p = this.playerMap.clientIDToPlayer(
      this.activePlayerControl.playerIdentifier
    );
    const msg = dfgmsg.encodeTurnMessage(p.name);
    this.onEventLogPush("TurnMessage", JSON.stringify(msg));
    if (!p.isConnected()) {
      this.roomProxy.broadcast(
        "PlayerWaitMessage",
        dfgmsg.encodePlayerWaitMessage(p.name, dfgmsg.WaitReason.RECONNECTION)
      );
    }
  }

  public notifyToActivePlayer(): void {
    if (!this.activePlayerControl) {
      this.invalidControllerError();
    }
    // 主権を持っているとき(DiscardStackが空のとき)は、パスする意味がないので、パスボタンを表示しないようにフロントエンドに伝える。
    const passable = this.game.outputDiscardStack().length > 0;
    this.roomProxy.send(
      this.activePlayerControl.playerIdentifier,
      "YourTurnMessage",
      dfgmsg.encodeYourTurnMessage(dfgmsg.YourTurnContext.ACTIVE, passable)
    );
  }

  public updateHandForActivePlayer(): void {
    // This method is intended to be used when the active player checked / unchecked cards. For updating all player cards state to latest, use updateCardsForEveryone.
    if (!this.activePlayerControl && !this.additionalActionControl) {
      this.invalidControllerError();
    }
    if (this.activePlayerControl) {
      return this.updateHandForActivePlayerControl();
    }
    return this.updateHandForAdditionalActionControl();
  }

  public selectCardByIndex(index: number): void {
    // activePlayerControlがあるときは、通常のプレイ状態。
    // additionalActionControlがあるときは、追加アクションの選択状態。
    if (!this.activePlayerControl && !this.additionalActionControl) {
      throw new InvalidGameStateError(
        "activePlayerControl and additionalActionControl are both null."
      );
    }

    if (this.activePlayerControl) {
      return this.selectCardByIndexForActivePlayer(
        this.activePlayerControl,
        index
      );
    }
    return this.selectCardByIndexForAdditionalAction(
      this.additionalActionControl,
      index
    );
  }

  public enumerateDiscardPairs(): void {
    if (!this.activePlayerControl && !this.additionalActionControl) {
      this.invalidControllerError();
    }
    if (this.activePlayerControl) {
      return this.enumerateDiscardPairsForActivePlayer();
    }
    return this.enumerateDiscardPairsForAdditionalAction();
  }

  public discardByIndex(index: number): boolean {
    // 有効なDiscardPairがないときに呼ぶと、 false を返すようにする。タイミング問題で変なメッセージが送られても、落ちる前に逃げるようにするため。
    if (!this.activePlayerControl && !this.additionalActionControl) {
      this.invalidControllerError();
    }
    if (index < 0) {
      return false;
    }
    if (this.activePlayerControl) {
      return this.discardByIndexForActivePlayer(index);
    }
    return this.discardByIndexForAdditionalAction(this.additionalActionControl);
  }

  public pass(): void {
    if (!this.activePlayerControl) {
      this.invalidControllerError();
    }

    this.activePlayerControl.pass();
    this.clearDiscardPairList(this.activePlayerControl.playerIdentifier);
    this.roomProxy.send(
      this.activePlayerControl.playerIdentifier,
      "YourTurnMessage",
      dfgmsg.encodeYourTurnMessage(dfgmsg.YourTurnContext.INACTIVE, false)
    );
  }

  public finishAction(): void {
    if (!this.activePlayerControl && !this.additionalActionControl) {
      this.invalidControllerError();
    }

    if (this.activePlayerControl) {
      this.game.finishActivePlayerControl(this.activePlayerControl);
      this.activePlayerControl = null;
      return;
    }
    this.game.finishAdditionalActionControl(this.additionalActionControl);
    this.additionalActionControl = null;
  }

  public handleNextAdditionalAction(): boolean {
    this.additionalActionControl = this.game.startAdditionalActionControl();
    if (!this.additionalActionControl) {
      return false;
    }
    switch (this.additionalActionControl.getType()) {
      case "transfer7":
        this.handleTransfer7();
        break;
      case "exile10":
        this.handleExile10();
        break;
    }
    return true;
  }

  public kickPlayerByIdentifier(identifier: string): boolean {
    // 次のプレイヤーにターンを移さなければいけないとき、trueを返す。
    if (!this.game) {
      this.gameInactiveError();
    }
    if (!this.activePlayerControl && !this.additionalActionControl) {
      this.invalidControllerError();
    }

    // キックするプレイヤーがゲームに参加中かどうかを確認
    // 観戦者であればゲームからキックする必要はない
    if (!this.game.enumeratePlayerIdentifiers().includes(identifier)) {
      return false;
    }
    let mustHandleNextPlayer = identifier === this.getActivePlayerIdentifier(); // 現在捜査中のプレイヤーがキックされる場合、次のプレイヤーにターンを回さなければならない
    this.game.kickPlayerByIdentifier(identifier);
    // 残りの人数が二人の時、キックした結果としてゲームが終わっている場合がある。ここでチェックしておかないと、ゲームが終わっているのに次のプレイヤーにターンを回そうとしてエラーが起きる。
    // ちょっとわかりにくいが、eventReceiverのコールバックで、ゲームが終わったら this.game = null が走るようになっているので、 isGameActive で判定すればよい。
    if (!this.isGameActive()) {
      mustHandleNextPlayer = false;
    }
    return mustHandleNextPlayer;
  }

  public getLatestDiscardStack(): dfg.CardSelectionPair[] {
    if (!this.game) {
      this.gameInactiveError();
    }

    return this.game.outputDiscardStack().reverse();
  }

  public getLatestRemovedCards(): dfg.RemovedCardEntry[] {
    if (!this.game) {
      this.gameInactiveError();
    }

    return this.game.outputRemovedCards();
  }

  public isPlayerInGame(identifier: string): boolean {
    if (!this.game) {
      return false;
    }
    return (
      this.game.enumeratePlayerIdentifiers().filter((v) => {
        return v === identifier;
      }).length > 0
    );
  }

  public handlePlayerReconnect(identifier: string): void {
    if (!this.game) {
      return;
    }

    this.updateCardsForEveryone();
    if (
      this.activePlayerControl &&
      this.activePlayerControl.playerIdentifier === identifier
    ) {
      this.notifyToActivePlayer();
      return;
    }

    if (this.additionalActionControl) {
      switch (this.additionalActionControl.getType()) {
        case "transfer7":
          this.handleTransfer7();
          break;
        case "exile10":
          this.handleExile10();
          break;
      }
      return;
    }
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

  private clearDiscardPairList(playerIdentifier: string) {
    // カードを出したプレイヤーのカード候補表示をクリアさせるため、空のDiscardPairListMessageを送って通知する
    this.roomProxy.send(
      playerIdentifier,
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

  private handleTransfer7() {
    if (!this.additionalActionControl) {
      throw new InvalidGameStateError("additional action control is invalid");
    }

    const t7action = this.additionalActionControl.cast<dfg.Transfer7>(
      dfg.Transfer7
    );
    this.roomProxy.send(
      t7action.playerIdentifier,
      "CardListMessage",
      this.cardEnumerator.enumerateFromAdditionalAction(t7action)
    );
    const p = this.playerMap.clientIDToPlayer(t7action.playerIdentifier);
    this.roomProxy.broadcast(
      "PlayerWaitMessage",
      dfgmsg.encodePlayerWaitMessage(p.name, dfgmsg.WaitReason.TRANSFER)
    );
    this.roomProxy.send(
      t7action.playerIdentifier,
      "YourTurnMessage",
      dfgmsg.encodeYourTurnMessage(dfgmsg.YourTurnContext.TRANSFER, false)
    );
  }

  private handleExile10() {
    if (!this.additionalActionControl) {
      throw new InvalidGameStateError("additional action control is invalid");
    }

    const e10action = this.additionalActionControl.cast<dfg.Exile10>(
      dfg.Exile10
    );
    this.roomProxy.send(
      e10action.playerIdentifier,
      "CardListMessage",
      this.cardEnumerator.enumerateFromAdditionalAction(e10action)
    );
    const p = this.playerMap.clientIDToPlayer(e10action.playerIdentifier);
    this.roomProxy.broadcast(
      "PlayerWaitMessage",
      dfgmsg.encodePlayerWaitMessage(p.name, dfgmsg.WaitReason.EXILE)
    );
    this.roomProxy.send(
      e10action.playerIdentifier,
      "YourTurnMessage",
      dfgmsg.encodeYourTurnMessage(dfgmsg.YourTurnContext.EXILE, false)
    );
  }

  private discardByIndexForActivePlayer(index: number): boolean {
    const dps = this.activePlayerControl.enumerateCardSelectionPairs();
    if (index >= dps.length) {
      return false;
    }

    this.activePlayerControl.discard(dps[index]);
    this.clearDiscardPairList(this.activePlayerControl.playerIdentifier);
    this.roomProxy.send(
      this.activePlayerControl.playerIdentifier,
      "YourTurnMessage",
      dfgmsg.encodeYourTurnMessage(dfgmsg.YourTurnContext.INACTIVE, false)
    );
    return true;
  }

  private discardByIndexForAdditionalAction(
    additionalActionControl: dfg.AdditionalActionControl
  ): boolean {
    // finishAdditionalActionControl is called at finishAction method
    this.clearDiscardPairList(additionalActionControl.playerIdentifier);
    this.roomProxy.send(
      additionalActionControl.playerIdentifier,
      "YourTurnMessage",
      dfgmsg.encodeYourTurnMessage(dfgmsg.YourTurnContext.INACTIVE, false)
    );
    return true;
  }

  private selectCardByIndexForActivePlayer(
    activePlayerControl: dfg.ActivePlayerControl,
    index: number
  ) {
    if (
      activePlayerControl.checkCardSelectability(index) ===
      dfg.SelectabilityCheckResult.NOT_SELECTABLE
    ) {
      return;
    }

    if (activePlayerControl.isCardSelected(index)) {
      activePlayerControl.deselectCard(index);
      return;
    }
    activePlayerControl.selectCard(index);
  }

  private selectCardByIndexForAdditionalAction(
    additionalActionControl: dfg.AdditionalActionControl,
    index: number
  ) {
    switch (additionalActionControl.getType()) {
      case "transfer7":
        this.selectCardByIndexForTransfer7(additionalActionControl, index);
        break;
      case "exile10":
        this.selectCardByIndexForExile10(additionalActionControl, index);
        break;
      default:
        throw new InvalidGameStateError("unrecognized additional action type");
    }
  }

  private selectCardByIndexForTransfer7(
    ctrl: dfg.AdditionalActionControl,
    index: number
  ) {
    const t7action = ctrl.cast<dfg.Transfer7>(dfg.Transfer7);
    if (
      t7action.checkCardSelectability(index) ===
      dfg.SelectabilityCheckResult.NOT_SELECTABLE
    ) {
      return;
    }
    if (t7action.isCardSelected(index)) {
      t7action.deselectCard(index);
      return;
    }
    t7action.selectCard(index);
  }

  private selectCardByIndexForExile10(
    ctrl: dfg.AdditionalActionControl,
    index: number
  ) {
    const e10action = ctrl.cast<dfg.Exile10>(dfg.Exile10);
    if (
      e10action.checkCardSelectability(index) ===
      dfg.SelectabilityCheckResult.NOT_SELECTABLE
    ) {
      return;
    }
    if (e10action.isCardSelected(index)) {
      e10action.deselectCard(index);
      return;
    }
    e10action.selectCard(index);
  }

  private updateHandForActivePlayerControl() {
    this.roomProxy.send(
      this.activePlayerControl.playerIdentifier,
      "CardListMessage",
      this.cardEnumerator.enumerateFromActivePlayerControl(
        this.activePlayerControl
      )
    );
  }

  private updateHandForAdditionalActionControl() {
    switch (this.additionalActionControl.getType()) {
      case "transfer7":
        this.updateHandForTransfer7();
        break;
      case "exile10":
        this.updateHandForExile10();
        break;
      default:
        throw new InvalidGameStateError("unrecognized additional action type");
    }
  }

  private updateHandForTransfer7() {
    const t7action = this.additionalActionControl.cast<dfg.Transfer7>(
      dfg.Transfer7
    );
    this.roomProxy.send(
      this.additionalActionControl.playerIdentifier,
      "CardListMessage",
      this.cardEnumerator.enumerateFromAdditionalAction(t7action)
    );
  }

  private updateHandForExile10() {
    const e10action = this.additionalActionControl.cast<dfg.Exile10>(
      dfg.Exile10
    );
    this.roomProxy.send(
      this.additionalActionControl.playerIdentifier,
      "CardListMessage",
      this.cardEnumerator.enumerateFromAdditionalAction(e10action)
    );
  }

  private enumerateDiscardPairsForActivePlayer() {
    this.roomProxy.send(
      this.activePlayerControl.playerIdentifier,
      "DiscardPairListMessage",
      dfgmsg.encodeDiscardPairListMessage(
        this.activePlayerControl.enumerateCardSelectionPairs().map((v) => {
          return dfgmsg.encodeDiscardPairMessage(
            v.cards.map((w) => {
              return dfgmsg.encodeCardMessage(w.mark, w.cardNumber);
            })
          );
        })
      )
    );
  }

  private enumerateDiscardPairsForAdditionalAction() {
    switch (this.additionalActionControl.getType()) {
      case "transfer7":
        this.enumerateDiscardPairsForTransfer7();
        break;
      case "exile10":
        this.enumerateDiscardPairsForExile10();
        break;
      default:
        throw new InvalidGameStateError("unrecognized additional action type");
    }
  }

  private enumerateDiscardPairsForTransfer7() {
    const t7action = this.additionalActionControl.cast<dfg.Transfer7>(
      dfg.Transfer7
    );
    let lst = dfgmsg.encodeDiscardPairListMessage([]);
    const csp = t7action.createCardSelectionPair();
    if (csp) {
      lst = dfgmsg.encodeDiscardPairListMessage([dfgmsg.encodeDiscardPairMessage([
        dfgmsg.encodeCardMessage(csp.cards[0].mark, csp.cards[0].cardNumber),
      ])]);
    }
    this.roomProxy.send(
      this.additionalActionControl.playerIdentifier,
      "DiscardPairListMessage",
      lst
    );
  }

  private enumerateDiscardPairsForExile10() {
    const e10action = this.additionalActionControl.cast<dfg.Exile10>(
      dfg.Exile10
    );
    const csp = e10action.createCardSelectionPair();
    let lst = dfgmsg.encodeDiscardPairListMessage([]);
    if (csp) {
      lst = dfgmsg.encodeDiscardPairListMessage([dfgmsg.encodeDiscardPairMessage([
        dfgmsg.encodeCardMessage(csp.cards[0].mark, csp.cards[0].cardNumber),
      ])]);
    }
    this.roomProxy.send(
      this.additionalActionControl.playerIdentifier,
      "DiscardPairListMessage",
      lst
    );
  }
}
