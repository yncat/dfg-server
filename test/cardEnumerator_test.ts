import { expect } from "chai";
import { CardEnumerator } from "../src/logic/cardEnumerator";
import * as dfg from "dfg-simulator";

describe("CardEnumerator", () => {
  it("can enumerate cards when player is inactive", () => {
    const ce = new CardEnumerator();
    const c1 = dfg.createCard(dfg.CardMark.SPADES, 4);
    const c2 = dfg.createCard(dfg.CardMark.SPADES, 5);
    const h = dfg.createHand();
    h.give(c1, c2);
    const msg = ce.enumerate(h, null);
    expect(msg.cardList).not.to.be.null;
    const cl = msg.cardList;
    expect(cl[0].markEnum).to.eql(dfg.CardMark.SPADES);
    expect(cl[0].cardNumber).to.eql(4);
    expect(cl[0].isChecked).to.be.false;
    expect(cl[0].isCheckable).to.be.false;
    expect(cl[1].markEnum).to.eql(dfg.CardMark.SPADES);
    expect(cl[1].cardNumber).to.eql(5);
    expect(cl[1].isChecked).to.be.false;
    expect(cl[1].isCheckable).to.be.false;
  });
});
