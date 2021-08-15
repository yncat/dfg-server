import * as dfg from "dfg-simulator";
import sinon from "sinon";
import { expect } from "chai";
import { EventReceiver } from "../src/logic/eventReceiver";
import { RoomProxy } from "../src/logic/roomProxy";
import { GameState } from "../src/rooms/schema/game";
import { Player } from "../src/logic/player";
import { PlayerMap } from "../src/logic/playerMap";
import * as dfgmsg from "../msg-src/dfgmsg";

function createEventReceiver(): EventReceiver {
  return new EventReceiver(new RoomProxy<GameState>(), new PlayerMap(), ()=>{});
}

describe("onNagare", () => {
  it("sends NagareMessage to everyone", () => {
    const er = createEventReceiver();
    const roomProxyMock = sinon.mock(er.roomProxy);
    roomProxyMock.expects("broadcast").calledWithExactly("NagareMessage", "");
    er.onNagare();
    roomProxyMock.verify();
  });
});

describe("onAgari", () => {
  it("sends AgariMessage to everyone", () => {
    const pi = "ccaatt";
    const pn = "cat";
    const msg = dfgmsg.encodeAgariMessage(pn);
    const player = <Player>{
      name: pn,
    };
    const er = createEventReceiver();
    const roomProxyMock = sinon.mock(er.roomProxy);
    roomProxyMock.expects("broadcast").calledWithExactly("AgariMessage", msg);
    const c2p = sinon.stub(er.playerMap, "clientIDToPlayer").returns(player);
    er.onAgari(pi);
    expect(c2p.calledWithExactly(pi)).to.be.true;
    roomProxyMock.verify();
  });
});

describe("onForbiddenAgari", () => {
  it("sends ForbiddenAgariMessage to everyone", () => {
    const pi = "ccaatt";
    const pn = "cat";
    const msg = dfgmsg.encodeForbiddenAgariMessage(pn);
    const player = <Player>{
      name: pn,
    };
    const er = createEventReceiver();
    const roomProxyMock = sinon.mock(er.roomProxy);
    roomProxyMock
      .expects("broadcast")
      .calledWithExactly("ForbiddenAgariMessage", msg);
    const c2p = sinon.stub(er.playerMap, "clientIDToPlayer").returns(player);
    er.onForbiddenAgari(pi);
    expect(c2p.calledWithExactly(pi)).to.be.true;
    roomProxyMock.verify();
  });
});

describe("onYagiri", () => {
  it("sends YagiriMessage to everyone", () => {
    const er = createEventReceiver();
    const roomProxyMock = sinon.mock(er.roomProxy);
    roomProxyMock.expects("broadcast").calledWithExactly("YagiriMessage", "");
    er.onYagiri("ccaatt");
    roomProxyMock.verify();
  });
});

describe("onJBack", () => {
  it("sends JBackMessage to everyone", () => {
    const er = createEventReceiver();
    const roomProxyMock = sinon.mock(er.roomProxy);
    roomProxyMock.expects("broadcast").calledWithExactly("JBackMessage", "");
    er.onJBack("ccaatt");
    roomProxyMock.verify();
  });
});

describe("onKakumei", () => {
  it("sends KakumeiMessage to everyone", () => {
    const er = createEventReceiver();
    const roomProxyMock = sinon.mock(er.roomProxy);
    roomProxyMock.expects("broadcast").calledWithExactly("KakumeiMessage", "");
    er.onKakumei("ccaatt");
    roomProxyMock.verify();
  });
});

describe("onStrengthInversion", () => {
  it("sends StrengthInversionMessage to everyone", () => {
    const er = createEventReceiver();
    const roomProxyMock = sinon.mock(er.roomProxy);
    const msg = dfgmsg.encodeStrengthInversionMessage(true);
    roomProxyMock
      .expects("broadcast")
      .calledWithExactly("StrengthInversionMessage", msg);
    er.onStrengthInversion(true);
    roomProxyMock.verify();
  });
});

describe("onDiscard", () => {
  it("sends DiscardMessage to everyone", () => {
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
    const dp = <dfg.DiscardPair>(<unknown>{
      cards: [c1, c2],
    });
    const er = createEventReceiver();
    const roomProxyMock = sinon.mock(er.roomProxy);
    roomProxyMock.expects("broadcast").calledWithExactly("DiscardMessage", msg);
    const c2p = sinon.stub(er.playerMap, "clientIDToPlayer").returns(player);
    er.onDiscard(pi, dp, 5);
    expect(c2p.calledWithExactly(pi)).to.be.true;
    roomProxyMock.verify();
  });
});

describe("onPass", () => {
  it("sends PassMessage to everyone", () => {
    const pi = "ccaatt";
    const pn = "cat";
    const msg = dfgmsg.encodePassMessage(pn);
    const player = <Player>{
      name: pn,
    };
    const er = createEventReceiver();
    const roomProxyMock = sinon.mock(er.roomProxy);
    roomProxyMock.expects("broadcast").calledWithExactly("PassMessage", msg);
    const c2p = sinon.stub(er.playerMap, "clientIDToPlayer").returns(player);
    er.onPass(pi);
    expect(c2p.calledWithExactly(pi)).to.be.true;
    roomProxyMock.verify();
  });
});

describe("onGameEnd", () => {
  it("sends GameEndMessage to everyone and calls gameEndedCallback", () => {
    const er = createEventReceiver();
    const roomProxyMock = sinon.mock(er.roomProxy);
    roomProxyMock.expects("broadcast").calledWithExactly("GameEndMessage", "");
    const f = sinon.fake();
    er.gameEndedCallback=f;
    er.onGameEnd();
    roomProxyMock.verify();
    expect(f.called).to.be.true;
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
    const roomProxyMock = sinon.mock(er.roomProxy);
    roomProxyMock
      .expects("broadcast")
      .calledWithExactly("PlayerKickedMessage", msg);
    const c2p = sinon.stub(er.playerMap, "clientIDToPlayer").returns(player);
    er.onPlayerKicked(pi);
    expect(c2p.calledWithExactly(pi)).to.be.true;
    roomProxyMock.verify();
  });
});

describe("onPlayerRankChanged", () => {
  it("sends PlayerRankChangedMessage to everyone", () => {
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
    const roomProxyMock = sinon.mock(er.roomProxy);
    roomProxyMock
      .expects("broadcast")
      .calledWithExactly("PlayerRankChangedMessage", msg);
    const c2p = sinon.stub(er.playerMap, "clientIDToPlayer").returns(player);
    er.onPlayerRankChanged(pi, dfg.RankType.UNDETERMINED, dfg.RankType.DAIFUGO);
    expect(c2p.calledWithExactly(pi)).to.be.true;
    roomProxyMock.verify();
  });
});

describe("onInitialInfoProvided", () => {
  it("sends InitialInfoMessage to everyone", () => {
    const er = createEventReceiver();
    const msg = dfgmsg.encodeInitialInfoMessage(4, 1);
    const roomProxyMock = sinon.mock(er.roomProxy);
    roomProxyMock
      .expects("broadcast")
      .calledWithExactly("InitialInfoMessage", msg);
    er.onInitialInfoProvided(4, 1);
    roomProxyMock.verify();
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
    const roomProxyMock = sinon.mock(er.roomProxy);
    roomProxyMock
      .expects("broadcast")
      .calledWithExactly("CardsProvidedMessage", msg);
    const c2p = sinon.stub(er.playerMap, "clientIDToPlayer").returns(player);
    er.onCardsProvided(pi, 10);
    expect(c2p.calledWithExactly(pi)).to.be.true;
    roomProxyMock.verify();
  });
});
