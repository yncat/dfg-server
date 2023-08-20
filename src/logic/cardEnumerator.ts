import * as dfg from "dfg-simulator";
import * as dfgmsg from "dfg-messages";

interface CardEnumeratableAdditionalAction {
  enumerateCards:() => dfg.Card[];
  isCardSelected:(index: number) => boolean;
  checkCardSelectability:(index: number) => dfg.SelectabilityCheckResult;
}

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

  public enumerateFromAdditionalAction(
    action: dfg.Transfer7 | dfg.Exile10
  ): dfgmsg.CardListMessage {
    return dfgmsg.encodeCardListMessage(
      action.enumerateCards().map((v, i) => {
        return dfgmsg.encodeSelectableCardMessage(
          v.ID,
          v.mark,
          v.cardNumber,
          action.isCardSelected(i),
          this.isSelectable(action.checkCardSelectability(i))
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
