import * as dfg from "dfg-simulator";
import sinon from "sinon";
import { expect } from "chai";
import { EventReceiver } from "../src/logic/eventReceiver";
import { Player } from "../src/logic/player";
import { PlayerMap } from "../src/logic/playerMap";
import * as dfgmsg from "dfg-messages";

function createCallbacks() {
  return {
    onGameEnd: () => { },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onEventLogPush: (eventType: string, eventBody: string) => { },
  };
}

function createEventReceiver(): EventReceiver {
  return new EventReceiver(
    new PlayerMap(),
    createCallbacks()
  );
}

function setFake(er: EventReceiver) {
  const f = sinon.fake(er.callbacks.onEventLogPush);
  sinon.replace(er.callbacks, "onEventLogPush", f);
  return f;
}

describe("onNagare", () => {
  it("inserts nagare event", () => {
    const er = createEventReceiver();
    const f = setFake(er);
    er.onNagare();
    expect(f.calledWith("NagareMessage", "")).to.be.true;
  });
});

describe("onAgari", () => {
  it("inserts agari event", () => {
    const pi = "ccaatt";
    const pn = "cat";
    const msg = dfgmsg.encodeAgariMessage(pn);
    const player = <Player>{
      name: pn,
    };
    const er = createEventReceiver();
    const f = setFake(er);
    sinon.stub(er.playerMap, "clientIDToPlayer").returns(player);
    er.onAgari(pi);
    expect(f.calledWith("AgariMessage", JSON.stringify(msg))).to.be.true;
  });
});

describe("onForbiddenAgari", () => {
  it("inserts forbidden agari event", () => {
    const pi = "ccaatt";
    const pn = "cat";
    const msg = dfgmsg.encodeForbiddenAgariMessage(pn);
    const player = <Player>{
      name: pn,
    };
    const er = createEventReceiver();
    const f = setFake(er);
    const c2p = sinon.stub(er.playerMap, "clientIDToPlayer").returns(player);
    er.onForbiddenAgari(pi);
    expect(c2p.calledWithExactly(pi)).to.be.true;
    expect(f.calledWith("ForbiddenAgariMessage", JSON.stringify(msg))).to.be
      .true;
  });
});

describe("onYagiri", () => {
  it("inserts yagiri event", () => {
    const er = createEventReceiver();
    const f = setFake(er);
    er.onYagiri("ccaatt");
    expect(f.calledWith("YagiriMessage", "")).to.be.true;
  });
});

describe("onJBack", () => {
  it("inserts j back event", () => {
    const er = createEventReceiver();
    const f = setFake(er);
    er.onJBack("ccaatt");
    expect(f.calledWith("JBackMessage", "")).to.be.true;
  });
});

describe("onKakumei", () => {
  it("inserts kakumei event", () => {
    const er = createEventReceiver();
    const f = setFake(er);
    er.onKakumei("ccaatt");
    expect(f.calledWith("KakumeiMessage", "")).to.be.true;
  });
});

describe("onStrengthInversion", () => {
  it("inserts strength inversion event", () => {
    const er = createEventReceiver();
    const f = setFake(er);
    const msg = dfgmsg.encodeStrengthInversionMessage(true);
    er.onStrengthInversion(true);
    expect(f.calledWith("StrengthInversionMessage", JSON.stringify(msg))).to.be
      .true;
  });
});

describe("onDiscard", () => {
  it("inserts discard event", () => {
    const pi = "ccaatt";
    const pn = "cat";
    const c1 = dfg.createCard(dfg.CardMark.SPADES, 5);
    const c2 = dfg.createCard(dfg.CardMark.HEARTS, 5);
    const msg = dfgmsg.encodeDiscardMessage(
      pn,
      dfgmsg.encodeDiscardPairMessage([
        dfgmsg.encodeCardMessage(c1.mark, c1.cardNumber),
        dfgmsg.encodeCardMessage(c2.mark, c2.cardNumber),
      ]),
      5
    );
    const player = <Player>{
      name: pn,
    };
    const dp = <dfg.CardSelectionPair>(<unknown>{
      cards: [c1, c2],
    });
    const er = createEventReceiver();
    const f = setFake(er);
    const c2p = sinon.stub(er.playerMap, "clientIDToPlayer").returns(player);
    er.onDiscard(pi, dp, 5);
    expect(c2p.calledWithExactly(pi)).to.be.true;
    expect(f.calledWith("DiscardMessage", JSON.stringify(msg))).to.be.true;
  });
});

describe("onPass", () => {
  it("inserts pass event", () => {
    const pi = "ccaatt";
    const pn = "cat";
    const msg = dfgmsg.encodePassMessage(pn, 3);
    const player = <Player>{
      name: pn,
    };
    const er = createEventReceiver();
    const f = setFake(er);
    const c2p = sinon.stub(er.playerMap, "clientIDToPlayer").returns(player);
    er.onPass(pi, 3);
    expect(c2p.calledWithExactly(pi)).to.be.true;
    expect(f.calledWith("PassMessage", JSON.stringify(msg))).to.be.true;
  });
});

describe("onGameEnd", () => {
  it("inserts game end event and calls gameEndedCallback", () => {
    const er = createEventReceiver();
    const fLogPush = setFake(er);
    const p1 = dfg.createPlayer("a");
    p1.rank.force(dfg.RankType.DAIFUGO);
    const p2 = dfg.createPlayer("b");
    p2.rank.force(dfg.RankType.DAIHINMIN);
    const player1 = <Player>{
      name: "cat",
    };
    const player2 = <Player>{
      name: "dog",
    };
    er.playerMap.clientIDToPlayer = sinon.fake((identifier: string) => {
      return identifier === "a" ? player1 : player2;
    });
    const r = dfg.createResult([p1, p2]);
    const msg = dfgmsg.encodeGameEndMessage(["cat"], [], [], [], ["dog"]);
    const f = sinon.fake();
    er.callbacks.onGameEnd = f;
    er.onGameEnd(r);
    expect(f.called).to.be.true;
    expect(fLogPush.calledWith("GameEndMessage", JSON.stringify(msg))).to.be
      .true;
  });
});

describe("onPlayerKicked", () => {
  it("sends PlayerKickedMessage to everyone", () => {
    const pi = "ccaatt";
    const pn = "cat";
    const msg = dfgmsg.encodePlayerKickedMessage(pn);
    const player = <Player>{
      name: pn,
    };
    const er = createEventReceiver();
    const f = setFake(er);
    const c2p = sinon.stub(er.playerMap, "clientIDToPlayer").returns(player);
    er.onPlayerKicked(pi);
    expect(c2p.calledWithExactly(pi)).to.be.true;
    expect(f.calledWith("PlayerKickedMessage", JSON.stringify(msg))).to.be.true;
  });
});

describe("onPlayerRankChanged", () => {
  it("inserts player rank changed event", () => {
    const pi = "ccaatt";
    const pn = "cat";
    const msg = dfgmsg.encodePlayerRankChangedMessage(
      pn,
      dfgmsg.RankType.UNDETERMINED,
      dfgmsg.RankType.DAIFUGO
    );
    const player = <Player>{
      name: pn,
    };
    const er = createEventReceiver();
    const f = setFake(er);
    const c2p = sinon.stub(er.playerMap, "clientIDToPlayer").returns(player);
    er.onPlayerRankChanged(pi, dfg.RankType.UNDETERMINED, dfg.RankType.DAIFUGO);
    expect(c2p.calledWithExactly(pi)).to.be.true;
    expect(f.calledWith("PlayerRankChangedMessage", JSON.stringify(msg))).to.be
      .true;
  });
});

describe("onInitialInfoProvided", () => {
  it("inserts initial info event", () => {
    const er = createEventReceiver();
    const f = setFake(er);
    const msg = dfgmsg.encodeInitialInfoMessage(4, 1);
    er.onInitialInfoProvided(4, 1);
    expect(f.calledWith("InitialInfoMessage", JSON.stringify(msg))).to.be.true;
  });
});

describe("onCardsProvided", () => {
  it("sends CardsProvidedMessage to everyone", () => {
    const pi = "ccaatt";
    const pn = "cat";
    const msg = dfgmsg.encodeCardsProvidedMessage(pn, 10);
    const player = <Player>{
      name: pn,
    };
    const er = createEventReceiver();
    const f = setFake(er);
    const c2p = sinon.stub(er.playerMap, "clientIDToPlayer").returns(player);
    er.onCardsProvided(pi, 10);
    expect(c2p.calledWithExactly(pi)).to.be.true;
    expect(f.calledWith("CardsProvidedMessage", JSON.stringify(msg))).to.be
      .true;
  });
});

describe("onTransfer", () => {
  it("inserts transfer event", () => {
    const pi1 = "ccaatt";
    const pn1 = "cat";
    const pi2 = "ddoogg";
    const pn2 = "dog";

    const card = dfg.createCard(dfg.CardMark.CLUBS, 3)
    const pair = <dfg.CardSelectionPair>(<unknown>{
      cards: [card],
    });
    const cardmsg = dfgmsg.encodeCardMessage(dfgmsg.CardMark.CLUBS, 3);
    const msg = dfgmsg.encodeTransferMessage(pn1, pn2, [cardmsg]);
    const player1 = <Player>{
      name: pn1,
    };
    const player2 = <Player>{
      name: pn2,
    };
    const er = createEventReceiver();
    const f = setFake(er);
    const stub = sinon.stub(er.playerMap, "clientIDToPlayer");
    stub.onCall(0).returns(player1);
    stub.onCall(1).returns(player2);
    er.onTransfer(pi1, pi2, pair);
    expect(f.calledWith("TransferMessage", JSON.stringify(msg))).to.be.true;
  });
});

describe("onExile", () => {
  it("inserts transfer event", () => {
    const pi1 = "ccaatt";
    const pn1 = "cat";

    const card = dfg.createCard(dfg.CardMark.CLUBS, 3)
    const pair = <dfg.CardSelectionPair>(<unknown>{
      cards: [card],
    });
    const cardmsg = dfgmsg.encodeCardMessage(dfgmsg.CardMark.CLUBS, 3);
    const msg = dfgmsg.encodeExileMessage(pn1, [cardmsg]);
    const player1 = <Player>{
      name: pn1,
    };
    const er = createEventReceiver();
    const f = setFake(er);
    const stub = sinon.stub(er.playerMap, "clientIDToPlayer");
    stub.onCall(0).returns(player1);
    er.onExile(pi1, pair);
    expect(f.calledWith("ExileMessage", JSON.stringify(msg))).to.be.true;
  });
});

