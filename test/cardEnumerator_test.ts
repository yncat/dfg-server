import { expect } from "chai";
import { CardEnumerator } from "../src/logic/cardEnumerator";
import * as dfg from "dfg-simulator";
import Sinon from "sinon";

describe("CardEnumerator", () => {
  it("can enumerate cards from a dfg.Hand instance", () => {
    const ce = new CardEnumerator();
    const c1 = dfg.createCard(dfg.CardMark.SPADES, 4);
    const c2 = dfg.createCard(dfg.CardMark.SPADES, 5);
    const h = dfg.createHand();
    h.give(c1, c2);
    const msg = ce.enumerateFromHand(h);
    expect(msg.cardList).not.to.be.null;
    const cl = msg.cardList;
    expect(cl[0].mark).to.eql(dfg.CardMark.SPADES);
    expect(cl[0].cardNumber).to.eql(4);
    expect(cl[0].isChecked).to.be.false;
    expect(cl[0].isCheckable).to.be.false;
    expect(cl[1].mark).to.eql(dfg.CardMark.SPADES);
    expect(cl[1].cardNumber).to.eql(5);
    expect(cl[1].isChecked).to.be.false;
    expect(cl[1].isCheckable).to.be.false;
  });

  it("can enumerate cards from a dfg.ActivePlayerControl instance", () => {
    const ce = new CardEnumerator();
    const cards = [
      dfg.createCard(dfg.CardMark.SPADES, 4),
      dfg.createCard(dfg.CardMark.SPADES, 5),
      dfg.createCard(dfg.CardMark.SPADES, 5),
    ];
    const selectabilities = [
      dfg.SelectabilityCheckResult.SELECTABLE,
      dfg.SelectabilityCheckResult.ALREADY_SELECTED,
      dfg.SelectabilityCheckResult.NOT_SELECTABLE,
    ];
    const selectStates = [false, true, false];
    const resultSelectableStates = [true, true, false];
    const apc = <dfg.ActivePlayerControl>(<unknown>{
      enumerateHand: Sinon.fake(() => {
        return cards;
      }),
      isCardSelected: Sinon.fake((idx: number) => {
        return selectStates[idx];
      }),
      checkCardSelectability: Sinon.fake((idx: number) => {
        return selectabilities[idx];
      }),
    });
    const msg = ce.enumerateFromActivePlayerControl(apc);
    expect(msg.cardList).not.to.be.null;
    msg.cardList.forEach((v, i) => {
      expect(v.mark).to.eql(cards[i].mark);
      expect(v.cardNumber).to.eql(cards[i].cardNumber);
      expect(v.isCheckable).to.eql(resultSelectableStates[i]);
      expect(v.isChecked).to.eql(selectStates[i]);
    });
  });
});
