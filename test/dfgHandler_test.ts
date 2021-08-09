import * as dfg from "dfg-simulator";
import sinon from "sinon";
import { expect } from "chai";
import { DFGHandler, EventReceiver } from "../src/logic/dfgHandler";
import { RoomProxy } from "../src/logic/roomProxy";
import { GameState } from "../src/rooms/schema/game";
import { Player } from "../src/logic/player";
import { PlayerMap } from "../src/logic/playerMap";
import * as dfgmsg from "../msg-src/dfgmsg";

function createDFGHandler(): DFGHandler {
  const rp = new RoomProxy<GameState>();
  const pm = new PlayerMap();
  const h = new DFGHandler(rp, pm);
  return h;
}

function createCards(): dfg.Card[] {
  return [
    dfg.createCard(dfg.CardMark.SPADES, 4),
    dfg.createCard(dfg.CardMark.SPADES, 5),
    dfg.createCard(dfg.CardMark.SPADES, 6),
  ];
}

function createGame() {
  const g = <dfg.Game>(<unknown>{
    enumeratePlayerIdentifiers: sinon.fake(() => {
      return ["a", "b", "c"];
    }),
  });
  return g;
}

describe("DFGHandler", () => {
  it("can be instantiated", () => {
    const h = createDFGHandler();
    expect(h).not.to.be.null;
  });

  it("can start a game", () => {
    const h = createDFGHandler();
    const g = createGame();
    const cg = sinon.fake(
      (
        clientIDList: string[],
        eventReceiver: dfg.EventReceiver,
        ruleConfig: dfg.RuleConfig
      ) => {
        return g;
      }
    );
    h["createGame"] = cg;
    h.startGame(["a", "b", "c"]);
    expect(cg.called).to.be.true;
  });

  describe("updateHandForEveryone", () => {
    it("can update hand info for everyone", () => {
      const p1 = dfg.createPlayer("a");
      p1.hand.give(...createCards());
      const p2 = dfg.createPlayer("b");
      p2.hand.give(...createCards());
      const p3 = dfg.createPlayer("c");
      p3.hand.give(...createCards());
      const h = createDFGHandler();
      const g = <dfg.Game>(<unknown>{
        enumeratePlayerIdentifiers: sinon.fake(() => {
          return ["a", "b", "c"];
        }),
        findPlayerByIdentifier: sinon.fake((identifier: string) => {
          switch (identifier) {
            case "a":
              return p1;
            case "b":
              return p2;
            case "c":
              return p3;
          }
          throw new Error("error");
        }),
      });
      h.game = g;
      const roomProxyMock = sinon.mock(h.roomProxy);
      roomProxyMock.expects("send").thrice();
      const cardEnumeratorMock = sinon.mock(h.cardEnumerator);
      cardEnumeratorMock.expects("enumerateFromHand").thrice();
      h.updateCardsForEveryone();
      roomProxyMock.verify();
      cardEnumeratorMock.verify();
    });

    it("throws an error when game is not started", () => {
      const h = createDFGHandler();
      expect(() => {
        h.updateCardsForEveryone();
      }).to.throw("game is inactive");
    });
  });

  describe("prepareNextPlayer", () => {
    it("can get the next player and notify the info to everyone", () => {
      const pn = "cat";
      const h = createDFGHandler();
      const apc = <dfg.ActivePlayerControl>(<unknown>{
        playerIdentifier: pn,
      });
      const g = <dfg.Game>(<unknown>{
        startActivePlayerControl: sinon.fake(() => {
          return apc;
        }),
      });
      const roomProxyMock = sinon.mock(h.roomProxy);
      const msg = dfgmsg.encodeTurnMessage(pn);
      roomProxyMock.expects("broadcast").withExactArgs("TurnMessage", msg);
      const p = <Player>{
        name: pn,
      };
      sinon.stub(h.playerMap, "clientIDToPlayer").returns(p);
      h.game = g;
      h.prepareNextPlayer();
      roomProxyMock.verify();
    });

    it("throws an error when game is not started", () => {
      const h = createDFGHandler();
      expect(() => {
        h.prepareNextPlayer();
      }).to.throw("game is inactive");
    });
  });

  describe("notifyToActivePlayer", () => {
    it("can send YourTurnMessage to the appropriate player", () => {
      const pi = "ccaatt";
      const h = createDFGHandler();
      const apc = <dfg.ActivePlayerControl>(<unknown>{
        playerIdentifier: pi,
      });
      h.activePlayerControl = apc;
      const roomProxyMock = sinon.mock(h.roomProxy);
      roomProxyMock.expects("send").withExactArgs(pi, "YourTurnMessage", "");
      h.notifyToActivePlayer();
      roomProxyMock.verify();
    });

    it("throws an error when activePlayerControl is not set", () => {
      const h = createDFGHandler();
      expect(() => {
        h.notifyToActivePlayer();
      }).to.throw("active player control is invalid");
    });
  });

  describe("updateHandForActivePlayer", () => {
    it("can send CardListMessage to the active player", () => {
      const pi = "ccaatt";
      const h = createDFGHandler();
      const apc = <dfg.ActivePlayerControl>(<unknown>{
        playerIdentifier: pi,
      });
      h.activePlayerControl = apc;
      const roomProxyMock = sinon.mock(h.roomProxy);
      const msg = dfgmsg.encodeCardListMessage([
        dfgmsg.encodeSelectableCardMessage(dfg.CardMark.SPADES, 3, true, true),
      ]);
      const enumerate = sinon
        .stub(h.cardEnumerator, "enumerateFromActivePlayerControl")
        .returns(msg);
      roomProxyMock.expects("send").withExactArgs(pi, "CardListMessage", msg);
      h.updateHandForActivePlayer();
      roomProxyMock.verify();
    });

    it("throws an error when activePlayerControl is not set", () => {
      const h = createDFGHandler();
      expect(() => {
        h.updateHandForActivePlayer();
      }).to.throw("active player control is invalid");
    });
  });

  describe("selectCardByIndex", () => {
    it("can select a card", () => {
      const pi = "ccaatt";
      const h = createDFGHandler();
      const ics = sinon.fake((index: number) => {
        return false;
      });
      const ccs = sinon.fake((index: number) => {
        return dfg.SelectabilityCheckResult.SELECTABLE;
      });
      const sc = sinon.fake((index: number) => {});
      const apc = <dfg.ActivePlayerControl>(<unknown>{
        playerIdentifier: pi,
        isCardSelected: ics,
        checkCardSelectability: ccs,
        selectCard: sc,
      });
      h.activePlayerControl = apc;
      h.selectCardByIndex(0);
      expect(ics.called).to.be.true;
      expect(ics.firstCall.firstArg).to.eql(0);
      expect(ccs.called).to.be.true;
      expect(ccs.firstCall.firstArg).to.eql(0);
      expect(sc.called).to.be.true;
      expect(sc.firstCall.firstArg).to.eql(0);
    });

    it("can deselect a card", () => {
      const pi = "ccaatt";
      const h = createDFGHandler();
      const ics = sinon.fake((index: number) => {
        return true;
      });
      const ccs = sinon.fake((index: number) => {
        return dfg.SelectabilityCheckResult.SELECTABLE;
      });
      const dsc = sinon.fake((index: number) => {});
      const apc = <dfg.ActivePlayerControl>(<unknown>{
        playerIdentifier: pi,
        isCardSelected: ics,
        checkCardSelectability: ccs,
        deselectCard: dsc,
      });
      h.activePlayerControl = apc;
      h.selectCardByIndex(0);
      expect(ics.called).to.be.true;
      expect(ics.firstCall.firstArg).to.eql(0);
      expect(ccs.called).to.be.true;
      expect(ccs.firstCall.firstArg).to.eql(0);
      expect(dsc.called).to.be.true;
      expect(dsc.firstCall.firstArg).to.eql(0);
    });

    it("does nothing when card is not selectable", () => {
      const pi = "ccaatt";
      const h = createDFGHandler();
      const ics = sinon.fake((index: number) => {
        return false;
      });
      const ccs = sinon.fake((index: number) => {
        return dfg.SelectabilityCheckResult.NOT_SELECTABLE;
      });
      const apc = <dfg.ActivePlayerControl>(<unknown>{
        playerIdentifier: pi,
        isCardSelected: ics,
        checkCardSelectability: ccs,
      });
      h.activePlayerControl = apc;
      h.selectCardByIndex(0);
      expect(ccs.called).to.be.true;
      expect(ccs.firstCall.firstArg).to.eql(0);
      expect(ics.called).to.be.false;
    });

    it("throws an error when activePlayerControl is not set", () => {
      const h = createDFGHandler();
      expect(() => {
        h.selectCardByIndex(0);
      }).to.throw("active player control is invalid");
    });
  });
});
