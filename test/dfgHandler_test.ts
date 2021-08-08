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
      cardEnumeratorMock.expects("enumerate").thrice();
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

  describe("notifyToCurrentPlayer", () => {
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
});
