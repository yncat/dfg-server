import * as dfg from "dfg-simulator";
import * as dfgmsg from "../../msg-src/dfgmsg";

export class CardEnumerator {
  public enumerateFromHand(hand: dfg.Hand): dfgmsg.CardListMessage {
    return dfgmsg.encodeCardListMessage(
      hand.cards.map((v) => {
        return dfgmsg.encodeCardMessage(v.mark, v.cardNumber, false, false);
      })
    );
  }

  public enumerateFromActivePlayerControl(
    activePlayerControl: dfg.ActivePlayerControl
  ): dfgmsg.CardListMessage {
    return dfgmsg.encodeCardListMessage(
      activePlayerControl.enumerateHand().map((v, i) => {
        return dfgmsg.encodeCardMessage(
          v.mark,
          v.cardNumber,
          activePlayerControl.isCardSelected(i),
          this.isSelectable(activePlayerControl.checkCardSelectability(i))
        );
      })
    );
  }

  private isSelectable(selectability:dfg.SelectabilityCheckResult){
    const ret = selectability === dfg.SelectabilityCheckResult.SELECTABLE || selectability === dfg.SelectabilityCheckResult.ALREADY_SELECTED;
    return selectability === dfg.SelectabilityCheckResult.SELECTABLE || selectability === dfg.SelectabilityCheckResult.ALREADY_SELECTED;
  }
}
