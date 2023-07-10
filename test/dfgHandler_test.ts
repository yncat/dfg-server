import * as dfg from "dfg-simulator";
import sinon from "sinon";
import { expect } from "chai";
import { DFGHandler } from "../src/logic/dfgHandler";
import { RoomProxy } from "../src/logic/roomProxy";
import { Player } from "../src/logic/player";
import { PlayerMap } from "../src/logic/playerMap";
import { GameRoom } from "../src/rooms/interface";
import { GameState } from "../src/rooms/schema/game";
import * as dfgmsg from "dfg-messages";
import { EditableMetadata } from "../src/logic/editableMetadata";

function createRuleConfig() {
  return {
    yagiri: true,
    jBack: true,
    kakumei: true,
    reverse: false,
    skip: dfgmsg.SkipConfig.OFF,
    transfer: false,
    exile: false,
  };
}

function createEventLogPushFunc() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (eventType: string, eventBody: string) => { };
}

function createDFGHandler(): DFGHandler {
  const rp = new RoomProxy<GameRoom>();
  const pm = new PlayerMap();
  const h = new DFGHandler(
    rp,
    pm,
    createRuleConfig(),
    createEventLogPushFunc()
  );
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
        clientIDList: string[], // eslint-disable-line @typescript-eslint/no-unused-vars
        eventReceiver: dfg.EventReceiver, // eslint-disable-line @typescript-eslint/no-unused-vars
        ruleConfig: dfg.RuleConfig // eslint-disable-line @typescript-eslint/no-unused-vars
      ) => {
        return g;
      }
    );
    h["createGame"] = cg;
    h.startGame(["a", "b", "c"]);
    expect(cg.called).to.be.true;
  });

  describe("isGameActive", () => {
    it("returns true when the game is active", () => {
      const h = createDFGHandler();
      const g = <dfg.Game>(<unknown>{});
      h.game = g;
      expect(h.isGameActive()).to.be.true;
    });

    it("returns false when the game is not active", () => {
      const h = createDFGHandler();
      expect(h.isGameActive()).to.be.false;
    });
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
      const p = <Player>{
        name: pn,
        isConnected: () => {
          return true;
        },
      };
      sinon.stub(h.playerMap, "clientIDToPlayer").returns(p);
      h.game = g;
      const f = sinon.fake(h.onEventLogPush);
      sinon.replace(h, "onEventLogPush", f);
      h.prepareNextPlayer();
      expect(f.callCount).to.eq(1);
      expect(f.calledWith("TurnMessage", JSON.stringify(msg))).to.be.true;
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
      roomProxyMock
        .expects("send")
        .withExactArgs(
          pi,
          "YourTurnMessage",
          dfgmsg.encodeYourTurnMessage(true)
        );
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
        dfgmsg.encodeSelectableCardMessage(
          "33abcd",
          dfg.CardMark.SPADES,
          3,
          true,
          true
        ),
      ]);
      sinon
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const ics = sinon.fake((index: number) => {
        return false;
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const ccs = sinon.fake((index: number) => {
        return dfg.SelectabilityCheckResult.SELECTABLE;
      });
      const sc = sinon.fake((index: number) => { }); // eslint-disable-line @typescript-eslint/no-unused-vars
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const ics = sinon.fake((index: number) => {
        return true;
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const ccs = sinon.fake((index: number) => {
        return dfg.SelectabilityCheckResult.SELECTABLE;
      });
      const dsc = sinon.fake((index: number) => { }); // eslint-disable-line @typescript-eslint/no-unused-vars
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const ics = sinon.fake((index: number) => {
        return false;
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      }).to.throw("activePlayerControl and additionalActionControl are both null.");
    });
  });

  describe("enumerateCardSelectionPairs", () => {
    it("can send CardSelectionPairListMessage to the active player", () => {
      const pi = "ccaatt";
      const h = createDFGHandler();
      const s4 = dfg.createCard(dfg.CardMark.SPADES, 4);
      const d4 = dfg.createCard(dfg.CardMark.DIAMONDS, 4);
      const s4m = dfgmsg.encodeCardMessage(s4.mark, s4.cardNumber);
      const d4m = dfgmsg.encodeCardMessage(d4.mark, d4.cardNumber);
      const dp1 = <dfg.CardSelectionPair>(<unknown>{
        cards: [s4, s4],
      });
      const dp2 = <dfg.CardSelectionPair>(<unknown>{
        cards: [d4, d4],
      });
      const edc = sinon.fake(() => {
        return [dp1, dp2];
      });
      const apc = <dfg.ActivePlayerControl>(<unknown>{
        playerIdentifier: pi,
        enumerateCardSelectionPairs: edc,
      });
      h.activePlayerControl = apc;
      const roomProxyMock = sinon.mock(h.roomProxy);
      const msg = dfgmsg.encodeDiscardPairListMessage([
        dfgmsg.encodeDiscardPairMessage([s4m, s4m]),
        dfgmsg.encodeDiscardPairMessage([d4m, d4m]),
      ]);
      roomProxyMock
        .expects("send")
        .calledWithExactly(pi, "CardSelectionPairListMessage", msg);
      h.enumerateDiscardPairs();
      expect(edc.called).to.be.true;
      roomProxyMock.verify();
    });

    it("sends CardSelectionPairListMessage with an empty CardSelectionPairList when no CardSelectionPair is enumerated", () => {
      const pi = "ccaatt";
      const h = createDFGHandler();
      const edc = sinon.fake((): dfg.CardSelectionPair[] => {
        return [];
      });
      const apc = <dfg.ActivePlayerControl>(<unknown>{
        playerIdentifier: pi,
        enumerateCardSelectionPairs: edc,
      });
      h.activePlayerControl = apc;
      const roomProxyMock = sinon.mock(h.roomProxy);
      const msg = dfgmsg.encodeDiscardPairListMessage([]);
      roomProxyMock
        .expects("send")
        .calledWithExactly(pi, "CardSelectionPairListMessage", msg);
      h.enumerateDiscardPairs();
      expect(edc.called).to.be.true;
      roomProxyMock.verify();
    });

    it("throws an error when activePlayerControl is not set", () => {
      const h = createDFGHandler();
      expect(() => {
        h.selectCardByIndex(0);
      }).to.throw("activePlayerControl and additionalActionControl are both null.");
    });
  });

  describe("discardByIndex", () => {
    it("can set discard info to activePlayerControl and returns true", () => {
      const pi = "ccaatt";
      const h = createDFGHandler();
      const g = <dfg.Game>(<unknown>{
        enumeratePlayerIdentifiers: sinon.fake((): string[] => {
          return [];
        }),
      });
      h.game = g;
      const s4 = dfg.createCard(dfg.CardMark.SPADES, 4);
      const dp1 = <dfg.CardSelectionPair>(<unknown>{
        cards: [s4, s4],
      });
      const edc = sinon.fake(() => {
        return [dp1];
      });
      const dc = sinon.fake((dp: dfg.CardSelectionPair) => { }); // eslint-disable-line @typescript-eslint/no-unused-vars
      const apc = <dfg.ActivePlayerControl>(<unknown>{
        playerIdentifier: pi,
        enumerateCardSelectionPairs: edc,
        discard: dc,
      });
      h.activePlayerControl = apc;
      const roomProxyMock = sinon.mock(h.roomProxy);
      roomProxyMock
        .expects("send")
        .withExactArgs(
          "ccaatt",
          "DiscardPairListMessage",
          dfgmsg.encodeDiscardPairListMessage([])
        );
      roomProxyMock
        .expects("send")
        .withExactArgs(
          pi,
          "YourTurnMessage",
          dfgmsg.encodeYourTurnMessage(false)
        );
      const ret = h.discardByIndex(0);
      roomProxyMock.verify();
      expect(ret).to.be.true;
      expect(edc.called).to.be.true;
      expect(dc.called).to.be.true;
      expect(dc.firstCall.firstArg).to.eql(dp1);
    });

    it("does nothing and returns false when index is out of range", () => {
      const pi = "ccaatt";
      const h = createDFGHandler();
      const s4 = dfg.createCard(dfg.CardMark.SPADES, 4);
      const dp1 = <dfg.CardSelectionPair>(<unknown>{
        cards: [s4, s4],
      });
      const edc = sinon.fake(() => {
        return [dp1];
      });
      const dc = sinon.fake((dp: dfg.CardSelectionPair) => { }); // eslint-disable-line @typescript-eslint/no-unused-vars
      const apc = <dfg.ActivePlayerControl>(<unknown>{
        playerIdentifier: pi,
        enumerateCardSelectionPairs: edc,
        discard: dc,
      });
      h.activePlayerControl = apc;
      const ret = h.discardByIndex(1);
      expect(ret).to.be.false;
      expect(edc.called).to.be.true;
      expect(dc.called).to.be.false;
    });

    it("does nothing when index is negative", () => {
      const pi = "ccaatt";
      const h = createDFGHandler();
      const s4 = dfg.createCard(dfg.CardMark.SPADES, 4);
      const dp1 = <dfg.CardSelectionPair>(<unknown>{
        cards: [s4, s4],
      });
      const edc = sinon.fake(() => {
        return [dp1];
      });
      const dc = sinon.fake((dp: dfg.CardSelectionPair) => { }); // eslint-disable-line @typescript-eslint/no-unused-vars
      const apc = <dfg.ActivePlayerControl>(<unknown>{
        playerIdentifier: pi,
        enumerateCardSelectionPairs: edc,
        discard: dc,
      });
      h.activePlayerControl = apc;
      h.discardByIndex(-1);
      expect(edc.called).to.be.false;
      expect(dc.called).to.be.false;
    });

    it("throws an error when activePlayerControl is not set", () => {
      const h = createDFGHandler();
      expect(() => {
        h.discardByIndex(0);
      }).to.throw("active player control is invalid");
    });
  });

  describe("pass", () => {
    it("calls activePlayerControl.pass", () => {
      const pi = "ccaatt";
      const h = createDFGHandler();
      const pass = sinon.fake();
      const apc = <dfg.ActivePlayerControl>(<unknown>{
        playerIdentifier: pi,
        pass: pass,
      });
      h.activePlayerControl = apc;
      const roomProxyMock = sinon.mock(h.roomProxy);
      roomProxyMock
        .expects("send")
        .withExactArgs(
          "ccaatt",
          "DiscardPairListMessage",
          dfgmsg.encodeDiscardPairListMessage([])
        );
      roomProxyMock
        .expects("send")
        .withExactArgs(
          pi,
          "YourTurnMessage",
          dfgmsg.encodeYourTurnMessage(false)
        );
      h.pass();
      expect(pass.called).to.be.true;
    });

    it("throws an error when activePlayerControl is not set", () => {
      const h = createDFGHandler();
      expect(() => {
        h.pass();
      }).to.throw("active player control is invalid");
    });
  });

  describe("finishAction", () => {
    it("calls game.finishActivePlayerControl", () => {
      const pi = "ccaatt";
      const h = createDFGHandler();
      const fapc = sinon.fake();
      const apc = <dfg.ActivePlayerControl>(<unknown>{
        playerIdentifier: pi,
      });
      const g = <dfg.Game>(<unknown>{
        finishActivePlayerControl: fapc,
      });
      h.activePlayerControl = apc;
      h.game = g;
      h.finishAction();
      expect(fapc.called).to.be.true;
    });

    it("throws an error when activePlayerControl is not set", () => {
      const h = createDFGHandler();
      expect(() => {
        h.finishAction();
      }).to.throw("active player control is invalid");
    });
  });

  describe("kickPlayerByIdentifier", () => {
    it("calls game.kickPlayerByIdentifier and returns true when kicking the active player", () => {
      const pi = "ccaatt";
      const h = createDFGHandler();
      const kick = sinon.fake((identifier: string) => { }); // eslint-disable-line @typescript-eslint/no-unused-vars
      const g = <dfg.Game>(<unknown>{
        kickPlayerByIdentifier: kick,
        enumeratePlayerIdentifiers: sinon.fake(() => {
          return new Array<string>("ccaatt", "ddoogg");
        }),
      });
      h.game = g;
      const apc = <dfg.ActivePlayerControl>(<unknown>{
        playerIdentifier: pi,
      });
      h.activePlayerControl = apc;
      const ret = h.kickPlayerByIdentifier(pi);
      expect(kick.calledWith(pi)).to.be.true;
      expect(ret).to.be.true;
    });

    it("calls game.kickPlayerByIdentifier and returns false when kicking the inactive player", () => {
      const pi = "ccaatt";
      const inactivePi = "ddoogg";
      const h = createDFGHandler();
      const kick = sinon.fake((identifier: string) => { }); // eslint-disable-line @typescript-eslint/no-unused-vars
      const g = <dfg.Game>(<unknown>{
        kickPlayerByIdentifier: kick,
        enumeratePlayerIdentifiers: sinon.fake(() => {
          return new Array<string>("ccaatt", "ddoogg");
        }),
      });
      h.game = g;
      const apc = <dfg.ActivePlayerControl>(<unknown>{
        playerIdentifier: pi,
      });
      h.activePlayerControl = apc;
      const ret = h.kickPlayerByIdentifier(inactivePi);
      expect(kick.calledWith(inactivePi)).to.be.true;
      expect(ret).to.be.false;
    });

    it("does not call game.kickPlayerByIdentifier and returns false when the identifier is not found", () => {
      const pi = "ccaatt";
      const h = createDFGHandler();
      const kick = sinon.fake((identifier: string) => { }); // eslint-disable-line @typescript-eslint/no-unused-vars
      const g = <dfg.Game>(<unknown>{
        kickPlayerByIdentifier: kick,
        enumeratePlayerIdentifiers: sinon.fake(() => {
          return new Array<string>("ccaatt", "ddoogg");
        }),
      });
      h.game = g;
      const apc = <dfg.ActivePlayerControl>(<unknown>{
        playerIdentifier: pi,
      });
      h.activePlayerControl = apc;
      const ret = h.kickPlayerByIdentifier("notfound");
      expect(kick.called).to.be.false;
      expect(ret).to.be.false;
    });

    it("throws an error when activePlayerControl is not set", () => {
      const h = createDFGHandler();
      const kick = sinon.fake((identifier: string) => { }); // eslint-disable-line @typescript-eslint/no-unused-vars
      const g = <dfg.Game>(<unknown>{
        kickPlayerByIdentifier: kick,
      });
      h.game = g;
      expect(() => {
        h.kickPlayerByIdentifier("ccaatt");
      }).to.throw("active player control is invalid");
    });

    it("throws an error when game is not set", () => {
      const h = createDFGHandler();
      expect(() => {
        h.kickPlayerByIdentifier("ccaatt");
      }).to.throw("game is inactive");
    });
  });

  describe("detecting game end", () => {
    it("make the game instance null when eventReceiver.onGameEnd is called", () => {
      const h = createDFGHandler();
      const g = <dfg.Game>(<unknown>{
        outputResult: sinon.fake(() => {
          return dfg.createResult([]);
        }),
        enumeratePlayerIdentifiers: sinon.fake((): string[] => {
          return [];
        }),
      });
      h.game = g;
      h.eventReceiver.onGameEnd(dfg.createResult([]));
      expect(h.game).to.be.null;
    });

    it("updates the room metadata", () => {
      const h = createDFGHandler();
      const em = new EditableMetadata<dfgmsg.GameRoomMetadata>(
        dfgmsg.encodeGameRoomMetadata(
          "cat",
          dfgmsg.RoomState.PLAYING,
          createRuleConfig(),
          []
        )
      );
      const state = new GameState();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
      const bc = sinon.fake((message: string, obj: any) => { });
      const rm = <GameRoom>(<unknown>{
        editableMetadata: em,
        state: state,
        broadcast: bc,
      });
      h["roomProxy"]["room"] = rm;
      const g = <dfg.Game>(<unknown>{
        outputResult: sinon.fake(() => {
          return dfg.createResult([]);
        }),
        enumeratePlayerIdentifiers: sinon.fake((): string[] => {
          return [];
        }),
      });
      h.game = g;
      const roomProxyMock = sinon.mock(h.roomProxy);
      roomProxyMock
        .expects("setMetadata")
        .calledWith(
          dfgmsg.encodeGameRoomMetadata(
            "cat",
            dfgmsg.RoomState.WAITING,
            createRuleConfig(),
            []
          )
        );
      h.eventReceiver.onGameEnd(dfg.createResult([]));
      roomProxyMock.verify();
    });
  });

  describe("handlePlayerReconnect", () => {
    it("ignores when game is not active", () => {
      const h = createDFGHandler();
      expect(() => {
        h.handlePlayerReconnect("a");
      }).not.to.throw();
    });

    it("updates player hand", () => {
      const pn1 = "cat";
      const pn2 = "dog";
      const h = createDFGHandler();
      const apc = <dfg.ActivePlayerControl>(<unknown>{
        playerIdentifier: pn1,
      });
      h["activePlayerControl"] = apc;
      const g = <dfg.Game>(<unknown>{});
      const updateCardsForEveryone = sinon.fake(() => { });
      const notifyToActivePlayer = sinon.fake(() => { });
      h["updateCardsForEveryone"] = updateCardsForEveryone;
      h["notifyToActivePlayer"] = notifyToActivePlayer;
      h.game = g;
      h.handlePlayerReconnect(pn2);
      expect(updateCardsForEveryone.calledOnce).to.be.true;
      expect(notifyToActivePlayer.called).to.be.false;
    });

    it("updates player hand and notify to the reconnected player", () => {
      const pn1 = "cat";
      const h = createDFGHandler();
      const apc = <dfg.ActivePlayerControl>(<unknown>{
        playerIdentifier: pn1,
      });
      h["activePlayerControl"] = apc;
      const g = <dfg.Game>(<unknown>{});
      const updateCardsForEveryone = sinon.fake(() => { });
      const notifyToActivePlayer = sinon.fake(() => { });
      h["updateCardsForEveryone"] = updateCardsForEveryone;
      h["notifyToActivePlayer"] = notifyToActivePlayer;
      h.game = g;
      h.handlePlayerReconnect(pn1);
      expect(updateCardsForEveryone.calledOnce).to.be.true;
      expect(notifyToActivePlayer.calledOnce).to.be.true;
    });
  });
});
