import * as dfg from "dfg-simulator";
import * as dfgmsg from "dfg-messages";

export class CardEnumerator {
  public enumerateFromHand(hand: dfg.Hand): dfgmsg.CardListMessage {
    return dfgmsg.encodeCardListMessage(
      hand.cards.map((v) => {
        return dfgmsg.encodeSelectableCardMessage(
          v.ID,
          v.mark,
          v.cardNumber,
          false,
          false
        );
      })
    );
  }

  public enumerateFromActivePlayerControl(
    activePlayerControl: dfg.ActivePlayerControl
  ): dfgmsg.CardListMessage {
    return dfgmsg.encodeCardListMessage(
      activePlayerControl.enumerateHand().map((v, i) => {
        return dfgmsg.encodeSelectableCardMessage(
          v.ID,
          v.mark,
          v.cardNumber,
          activePlayerControl.isCardSelected(i),
          this.isSelectable(activePlayerControl.checkCardSelectability(i))
        );
      })
    );
  }

  private isSelectable(selectability: dfg.SelectabilityCheckResult) {
    return (
      selectability === dfg.SelectabilityCheckResult.SELECTABLE ||
      selectability === dfg.SelectabilityCheckResult.ALREADY_SELECTED
    );
  }
}
