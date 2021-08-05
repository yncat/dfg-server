import * as dfg from "dfg-simulator";
import * as dfgmsg from "../../msg-src/dfgmsg";

export class CardEnumerator {
  public enumerate(
    hand: dfg.Hand,
    activePlayerControl: dfg.ActivePlayerControl | null = null
  ): dfgmsg.CardListMessage {
    return this.inactive(hand);
  }

  private inactive(hand: dfg.Hand): dfgmsg.CardListMessage {
    return dfgmsg.encodeCardListMessage(
      hand.cards.map((v) => {
        return dfgmsg.encodeCardMessage(v.mark, v.cardNumber, false, false);
      })
    );
  }
}
