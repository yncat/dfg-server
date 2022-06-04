/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import sinon from "sinon";
import { expect } from "chai";
import { ColyseusTestServer, boot } from "@colyseus/testing";
// import your "arena.config.ts" file here.
import appConfig from "../src/arena.config";
import * as dfgmsg from "dfg-messages";
import * as dfg from "dfg-simulator";
import { GameRoom } from "../src/rooms/game";
import { protocolVersion } from "../src/protocolVersion";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function dummyMessageHandler(message: any) {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createMessageReceiver() {
  return sinon.fake((message: any) => {}); // eslint-disable-line @typescript-eslint/no-unused-vars
}

function clientOptionsWithDefault(playerName: string) {
  return { playerName: playerName, protocolVersion: protocolVersion };
}

function setRoomOptionsForTest(r: unknown, skipKickOnLeave: boolean) {
  const room = r as GameRoom;
  room.setRoomOptionsForTest(skipKickOnLeave);
}

function forMilliseconds(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

interface TestClient {
  sessionId: string;
  onMessage: (message: string | number, clbk: (payload: any) => void) => void;
  send: (message: string, payload: any) => void;
}

function getActivePlayer(
  room: unknown,
  client1: TestClient,
  client2: TestClient
): TestClient {
  return (room as GameRoom).dfgHandler.activePlayerControl.playerIdentifier ===
    client1.sessionId
    ? client1
    : client2;
}

class MessageReceiverMap {
  mp: Map<string, sinon.SinonSpy<any[], any>>;
  constructor() {
    this.mp = new Map();
  }

  public registerFake(clientList: TestClient[], messageList: string[]) {
    clientList.forEach((v) => {
      messageList.forEach((w) => {
        const f = createMessageReceiver();
        this.mp.set(v.sessionId + "_" + w, f);
        v.onMessage(w, f);
      });
    });
  }

  public getFake(
    client: TestClient,
    message: string
  ): sinon.SinonSpy<any, any[]> {
    const f = this.mp.get(client.sessionId + "_" + message);
    if (!f) {
      throw new Error("failure on MessageReceiverMap resolution");
    }
    return f; // eslint-disable-line @typescript-eslint/no-unsafe-return
  }

  public resetHistory() {
    const itr = this.mp.values();
    let f = itr.next();
    while (!f.done) {
      f.value.resetHistory(); // eslint-disable-line @typescript-eslint/no-unsafe-call
      f = itr.next();
    }
  }
}

function createGameBeforeAgari(
  client1: TestClient,
  client2: TestClient,
  er: dfg.EventReceiver
) {
  const p1 = dfg.createPlayer(client1.sessionId);
  const p2 = dfg.createPlayer(client2.sessionId);
  p1.hand.give(dfg.createCard(dfg.CardMark.DIAMONDS, 4));
  p2.hand.give(dfg.createCard(dfg.CardMark.CLUBS, 5));
  return dfg.createGameCustom({
    players: [p1, p2],
    activePlayerIndex: 0,
    activePlayerActionCount: 0,
    discardStack: dfg.createDiscardStack(),
    lastDiscarderIdentifier: "",
    strengthInverted: false,
    agariPlayerIdentifiers: [],
    penalizedPlayerIdentifiers: [],
    eventReceiver: er,
    ruleConfig: dfg.createDefaultRuleConfig(),
    removedCardsMap: new Map<dfg.CardMark, Map<dfg.CardNumber, number>>(),
    reversed: false,
  });
}

describe("e2e test", () => {
  let colyseus: ColyseusTestServer;

  before(async () => (colyseus = await boot(appConfig)));
  after(async () => colyseus.shutdown());

  // beforeEach is executed for all sub tests
  beforeEach(async () => {
    await colyseus.cleanup();
  });

  describe("globalRoom", () => {
    it("connecting into the global room", async () => {
      // `room` is the server-side Room instance reference.
      const room = await colyseus.createRoom("global_room", {});

      // `client1` is the client-side `Room` instance reference (same as JavaScript SDK)
      const client1 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("cat")
      );

      // make your assertions
      expect(client1.sessionId).to.eql(room.clients[0].sessionId);
    });

    it("handle RoomCreatedRequest", async () => {
      const room = await colyseus.createRoom("global_room", {});
      const client1 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("cat")
      );
      const cfn1 = createMessageReceiver();
      client1.onMessage("RoomCreatedMessage", cfn1);
      const client2 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("dog")
      );
      const cfn2 = createMessageReceiver();
      client2.onMessage("RoomCreatedMessage", cfn2);
      client1.send("RoomCreatedRequest", "");
      await Promise.all([
        client1.waitForMessage("RoomCreatedMessage"),
        client2.waitForMessage("RoomCreatedMessage"),
        room.waitForNextPatch(),
      ]);
      const want = { playerName: "cat" };
      expect(cfn1.firstCall.lastArg).to.eql(want);
      expect(cfn2.firstCall.lastArg).to.eql(want);
    });

    it("handle chat message", async () => {
      const room = await colyseus.createRoom("global_room", {});
      const client1 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("cat")
      );
      const cfn1 = createMessageReceiver();
      client1.onMessage("ChatMessage", cfn1);
      const client2 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("dog")
      );
      const cfn2 = createMessageReceiver();
      client2.onMessage("ChatMessage", cfn2);
      client1.send("ChatRequest", dfgmsg.encodeChatRequest("hello"));
      await Promise.all([
        client1.waitForMessage("ChatMessage"),
        client2.waitForMessage("ChatMessage"),
        room.waitForNextPatch(),
      ]);
      const want = { playerName: "cat", message: "hello" };
      expect(cfn1.firstCall.lastArg).to.eql(want);
      expect(cfn2.firstCall.lastArg).to.eql(want);
    });
  });

  describe("gameRoom", () => {
    it("connecting into the game room", async () => {
      const room = await colyseus.createRoom("game_room", {});
      setRoomOptionsForTest(room, true);
      const clbk = createMessageReceiver();
      const client1 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("cat")
      );
      client1.onMessage("RoomOwnerMessage", clbk);
      client1.onMessage("PlayerJoinedMessage", dummyMessageHandler);
      client1.onMessage("PlayerLeftMessage", dummyMessageHandler);
      expect(client1.sessionId).to.eql(room.clients[0].sessionId);
      const rm = room as GameRoom;
      expect(rm.state.playerNameList.length).to.eql(1);
      expect(rm.state.playerNameList[0]).to.eql("cat");
    });

    it("send RoomOwnerMessage to the first connected player", async () => {
      const room = await colyseus.createRoom("game_room", {});
      setRoomOptionsForTest(room, true);
      const clbk = createMessageReceiver();
      const client1 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("cat")
      );
      client1.onMessage("RoomOwnerMessage", clbk);
      client1.onMessage("PlayerJoinedMessage", dummyMessageHandler);
      client1.onMessage("PlayerLeftMessage", dummyMessageHandler);
      await client1.waitForMessage("RoomOwnerMessage");
      expect(clbk.called).to.be.true;
      const rm = room as GameRoom;
      expect(rm.state.ownerPlayerName).to.eql("cat");
    });

    it("broadcast PlayerJoinedMessage when second player joins", async () => {
      const room = await colyseus.createRoom("game_room", {});
      setRoomOptionsForTest(room, true);
      const client1 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("cat")
      );
      const cfn1 = createMessageReceiver();
      client1.onMessage("PlayerJoinedMessage", cfn1);
      client1.onMessage("RoomOwnerMessage", dummyMessageHandler);
      client1.onMessage("PlayerLeftMessage", dummyMessageHandler);
      const client2 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("dog")
      );
      const cfn2 = createMessageReceiver();
      client2.onMessage("PlayerJoinedMessage", cfn2);
      client2.onMessage("PlayerLeftMessage", dummyMessageHandler);
      await forMilliseconds(300);
      const want = { playerName: "dog" };
      expect(cfn1.calledTwice).to.be.true;
      expect(cfn2.calledOnce).to.be.true;
      expect(cfn1.secondCall.lastArg).to.eql(want);
      expect(cfn2.firstCall.lastArg).to.eql(want);
      const rm = room as GameRoom;
      expect(rm.state.playerNameList.length).to.eql(2);
      expect(rm.state.playerNameList[0]).to.eql("cat");
      expect(rm.state.playerNameList[1]).to.eql("dog");
    });

    it("room owner's loss moves room owner client to another player who joined next", async () => {
      const room = await colyseus.createRoom("game_room", {});
      setRoomOptionsForTest(room, true);
      const client1 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("cat")
      );
      client1.onMessage("PlayerJoinedMessage", dummyMessageHandler);
      client1.onMessage("RoomOwnerMessage", dummyMessageHandler);
      const client2 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("dog")
      );
      client2.onMessage("PlayerJoinedMessage", dummyMessageHandler);
      const left = sinon.fake();
      client2.onMessage("PlayerLeftMessage", left);
      const mas = createMessageReceiver();
      client2.onMessage("RoomOwnerMessage", mas);
      await forMilliseconds(100);
      expect(room.metadata.owner).to.eql("cat");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      void client1.leave();
      await forMilliseconds(100);
      expect(left.called).to.be.true;
      expect(mas.called).to.be.true;
      const rm = room as GameRoom;
      expect(room.metadata.owner).to.eql("dog");
      expect(rm.state.ownerPlayerName).to.eql("dog");
      expect(rm.state.playerNameList.length).to.eql(1);
      expect(rm.state.playerNameList[0]).to.eql("dog");
    });

    it("handle chat message", async () => {
      const room = await colyseus.createRoom("game_room", {});
      setRoomOptionsForTest(room, true);
      const client1 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("cat")
      );
      client1.onMessage("RoomOwnerMessage", dummyMessageHandler);
      client1.onMessage("PlayerJoinedMessage", dummyMessageHandler);
      client1.onMessage("PlayerLeftMessage", dummyMessageHandler);
      const cfn1 = createMessageReceiver();
      client1.onMessage("ChatMessage", cfn1);
      const client2 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("dog")
      );
      client2.onMessage("PlayerJoinedMessage", dummyMessageHandler);
      client2.onMessage("PlayerLeftMessage", dummyMessageHandler);
      const cfn2 = createMessageReceiver();
      client2.onMessage("ChatMessage", cfn2);
      client1.send("ChatRequest", dfgmsg.encodeChatRequest("hello"));
      await Promise.all([
        client1.waitForMessage("ChatMessage"),
        client2.waitForMessage("ChatMessage"),
        room.waitForNextPatch(),
      ]);
      const want = { playerName: "cat", message: "hello" };
      expect(cfn1.firstCall.lastArg).to.eql(want);
      expect(cfn2.firstCall.lastArg).to.eql(want);
    });

    it("game owner can start the game", async () => {
      const room = await colyseus.createRoom("game_room", {});
      setRoomOptionsForTest(room, true);
      const mrm = new MessageReceiverMap();
      const client1 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("cat")
      );
      mrm.registerFake(
        [client1],
        ["RoomOwnerMessage", "PlayerJoinedMessage", "PlayerLeftMessage"]
      );
      const client2 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("dog")
      );
      mrm.registerFake(
        [client2],
        ["RoomOwnerMessage", "PlayerJoinedMessage", "PlayerLeftMessage"]
      );
      mrm.registerFake(
        [client1, client2],
        [
          "InitialInfoMessage",
          "CardsProvidedMessage",
          "CardListMessage",
          "TurnMessage",
          "YourTurnMessage",
        ]
      );
      client1.send("GameStartRequest");
      await forMilliseconds(300);
      const ii1 = mrm.getFake(client1, "InitialInfoMessage");
      const ii2 = mrm.getFake(client2, "InitialInfoMessage");
      expect(ii1.calledOnce).to.be.true;
      expect(ii2.calledOnce).to.be.true;
      expect(ii1.firstCall.firstArg.playerCount).to.eql(2);
      expect(ii1.firstCall.firstArg.deckCount).to.eql(1);
      expect(ii2.firstCall.firstArg.playerCount).to.eql(2);
      expect(ii2.firstCall.firstArg.deckCount).to.eql(1);
      const cp1 = mrm.getFake(client1, "CardsProvidedMessage");
      const cp2 = mrm.getFake(client2, "CardsProvidedMessage");
      expect(cp1.calledTwice).to.be.true;
      expect(cp2.calledTwice).to.be.true;
      expect(cp1.firstCall.firstArg.cardCount).to.eql(27);
      expect(cp1.secondCall.firstArg.cardCount).to.eql(27);
      expect(cp2.firstCall.firstArg.cardCount).to.eql(27);
      expect(cp2.secondCall.firstArg.cardCount).to.eql(27);
      const t1 = mrm.getFake(client1, "TurnMessage");
      const t2 = mrm.getFake(client2, "TurnMessage");
      expect(t1.calledOnce).to.be.true;
      expect(t2.calledOnce).to.be.true;
      const activePlayer = getActivePlayer(room, client1, client2);
      const inactivePlayer = activePlayer === client1 ? client2 : client1;
      expect(mrm.getFake(activePlayer, "YourTurnMessage").calledOnce).to.be
        .true;
      expect(mrm.getFake(inactivePlayer, "YourTurnMessage").called).to.be.false;
      expect(mrm.getFake(activePlayer, "CardListMessage").calledTwice).to.be
        .true;
      expect(mrm.getFake(inactivePlayer, "CardListMessage").calledOnce).to.be
        .true;
    });

    it("does nothing when the request sent twice", async () => {
      const room = await colyseus.createRoom("game_room", {});
      setRoomOptionsForTest(room, true);
      const mrm = new MessageReceiverMap();
      const client1 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("cat")
      );
      mrm.registerFake([client1], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      const client2 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("dog")
      );
      mrm.registerFake([client2], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      mrm.registerFake(
        [client1, client2],
        [
          "PlayerLeftMessage",
          "InitialInfoMessage",
          "CardsProvidedMessage",
          "CardListMessage",
          "TurnMessage",
          "YourTurnMessage",
        ]
      );
      client1.send("GameStartRequest");
      await forMilliseconds(300);
      const ii1 = mrm.getFake(client1, "InitialInfoMessage");
      const ii2 = mrm.getFake(client2, "InitialInfoMessage");
      expect(ii1.calledOnce).to.be.true;
      expect(ii2.calledOnce).to.be.true;
      client1.send("GameStartRequest");
      await forMilliseconds(300);
      expect(ii1.calledOnce).to.be.true;
      expect(ii2.calledOnce).to.be.true;
    });

    it("non-room-owner cannot start the game", async () => {
      const room = await colyseus.createRoom("game_room", {});
      setRoomOptionsForTest(room, true);
      const client1 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("cat")
      );
      const fk = createMessageReceiver();
      client1.onMessage("PlayerJoinedMessage", fk);
      client1.onMessage("PlayerLeftMessage", dummyMessageHandler);
      client1.onMessage("RoomOwnerMessage", fk);
      const ii1 = createMessageReceiver();
      const cp1 = createMessageReceiver();
      const cl1 = createMessageReceiver();
      client1.onMessage("InitialInfoMessage", ii1);
      client1.onMessage("CardsProvidedMessage", cp1);
      client1.onMessage("CardListMessage", cl1);
      const client2 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("dog")
      );
      client2.onMessage("PlayerJoinedMessage", fk);
      client2.onMessage("PlayerLeftMessage", dummyMessageHandler);
      const ii2 = createMessageReceiver();
      const cp2 = createMessageReceiver();
      const cl2 = createMessageReceiver();
      client2.onMessage("InitialInfoMessage", ii2);
      client2.onMessage("CardsProvidedMessage", cp2);
      client2.onMessage("CardListMessage", cl2);
      client2.send("GameStartRequest");
      await forMilliseconds(300);
      expect(ii1.called).to.be.false;
      expect(ii2.called).to.be.false;
      expect(cp1.called).to.be.false;
      expect(cp2.called).to.be.false;
      expect(cl1.called).to.be.false;
      expect(cl2.called).to.be.false;
    });

    it("can select and deselect a card", async () => {
      const room = await colyseus.createRoom("game_room", {});
      setRoomOptionsForTest(room, true);
      const mrm = new MessageReceiverMap();
      const client1 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("cat")
      );
      mrm.registerFake([client1], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      const client2 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("dog")
      );
      mrm.registerFake([client2], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      mrm.registerFake(
        [client1, client2],
        [
          "PlayerLeftMessage",
          "InitialInfoMessage",
          "CardsProvidedMessage",
          "CardListMessage",
          "TurnMessage",
          "YourTurnMessage",
          "DiscardPairListMessage",
        ]
      );
      client1.send("GameStartRequest");
      await forMilliseconds(300);
      mrm.resetHistory();
      const activePlayer = getActivePlayer(room, client1, client2);
      const msg = dfgmsg.encodeCardSelectRequest(0);
      activePlayer.send("CardSelectRequest", msg);
      await forMilliseconds(100);
      const cl = mrm.getFake(activePlayer, "CardListMessage");
      expect(cl.calledOnce).to.be.true;
      expect(cl.firstCall.lastArg.cardList[0].isChecked).to.be.true;
      const card = cl.firstCall.lastArg.cardList[0]; // eslint-disable-line @typescript-eslint/no-unsafe-assignment
      expect(card.isCheckable).to.be.true;
      const dp = mrm.getFake(activePlayer, "DiscardPairListMessage"); // eslint-disable-line @typescript-eslint/no-unsafe-assignment
      expect(dp.calledOnce).to.be.true;
      expect(dp.firstCall.lastArg.discardPairList.length).to.eql(1);
      const discard = dp.firstCall.lastArg.discardPairList[0]; // eslint-disable-line @typescript-eslint/no-unsafe-assignment
      expect(discard.cardList.length).to.eql(1);
      const card2 = discard.cardList[0]; // eslint-disable-line @typescript-eslint/no-unsafe-assignment
      expect(card.mark).to.eql(card2.mark);
      expect(card.cardNumber).to.eql(card2.cardNumber);
      mrm.resetHistory();
      activePlayer.send("CardSelectRequest", msg);
      await forMilliseconds(100);
      expect(cl.calledOnce).to.be.true;
      expect(cl.firstCall.lastArg.cardList[0].isChecked).to.be.false;
      expect(dp.calledOnce).to.be.true;
      expect(dp.firstCall.lastArg.discardPairList.length).to.eql(0);
    });

    it("does nothing when game is inactive", async () => {
      const room = await colyseus.createRoom("game_room", {});
      setRoomOptionsForTest(room, true);
      const mrm = new MessageReceiverMap();
      const client1 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("cat")
      );
      mrm.registerFake([client1], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      const client2 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("dog")
      );
      mrm.registerFake([client2], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      mrm.registerFake(
        [client1, client2],
        [
          "PlayerLeftMessage",
          "InitialInfoMessage",
          "CardsProvidedMessage",
          "CardListMessage",
          "TurnMessage",
          "YourTurnMessage",
          "DiscardPairListMessage",
        ]
      );
      const msg = dfgmsg.encodeCardSelectRequest(0);
      client1.send("CardSelectRequest", msg);
      await forMilliseconds(100);
      const cl1 = mrm.getFake(client1, "CardListMessage");
      expect(cl1.called).to.be.false;
    });

    it("does nothing when the player is not currently active", async () => {
      const room = await colyseus.createRoom("game_room", {});
      setRoomOptionsForTest(room, true);
      const mrm = new MessageReceiverMap();
      const client1 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("cat")
      );
      mrm.registerFake([client1], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      const client2 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("dog")
      );
      mrm.registerFake([client2], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      mrm.registerFake(
        [client1, client2],
        [
          "PlayerLeftMessage",
          "InitialInfoMessage",
          "CardsProvidedMessage",
          "CardListMessage",
          "TurnMessage",
          "YourTurnMessage",
          "DiscardPairListMessage",
        ]
      );
      client1.send("GameStartRequest");
      await forMilliseconds(300);
      mrm.resetHistory();
      const inactivePlayer =
        getActivePlayer(room, client1, client2) === client1 ? client2 : client1;
      const msg = dfgmsg.encodeCardSelectRequest(0);
      inactivePlayer.send("CardSelectRequest", msg);
      await forMilliseconds(100);
      const cl = mrm.getFake(inactivePlayer, "CardListMessage");
      expect(cl.called).to.be.false;
    });

    it("can play a pair of cards", async () => {
      const room = await colyseus.createRoom("game_room", {});
      setRoomOptionsForTest(room, true);
      const mrm = new MessageReceiverMap();
      const client1 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("cat")
      );
      mrm.registerFake([client1], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      const client2 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("dog")
      );
      mrm.registerFake([client2], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      mrm.registerFake(
        [client1, client2],
        [
          "PlayerLeftMessage",
          "InitialInfoMessage",
          "CardsProvidedMessage",
          "CardListMessage",
          "TurnMessage",
          "YourTurnMessage",
          "DiscardPairListMessage",
          "DiscardMessage",
        ]
      );
      client1.send("GameStartRequest");
      await forMilliseconds(300);
      mrm.resetHistory();
      const activePlayer = getActivePlayer(room, client1, client2);
      const msg = dfgmsg.encodeCardSelectRequest(0);
      activePlayer.send("CardSelectRequest", msg);
      await forMilliseconds(100);
      const cl = mrm.getFake(activePlayer, "CardListMessage");
      expect(cl.calledOnce).to.be.true;
      const card = dfgmsg.decodePayload<dfgmsg.SelectableCardMessage>(
        cl.firstCall.lastArg.cardList[0],
        dfgmsg.SelectableCardMessageDecoder
      ) as dfgmsg.SelectableCardMessage;
      const dp = mrm.getFake(activePlayer, "DiscardPairListMessage"); // eslint-disable-line @typescript-eslint/no-unsafe-assignment
      expect(dp.calledOnce).to.be.true;
      mrm.resetHistory();
      activePlayer.send("DiscardRequest", dfgmsg.encodeDiscardRequest(0));
      await forMilliseconds(100);
      const dc1 = mrm.getFake(client1, "DiscardMessage");
      const dc2 = mrm.getFake(client2, "DiscardMessage");
      expect(dc1.calledOnce).to.be.true;
      expect(dc2.calledOnce).to.be.true;
      expect(dc1.firstCall.lastArg.discardPair.cardList.length).to.eql(1);
      expect(dc2.firstCall.lastArg.discardPair.cardList.length).to.eql(1);
      const dcm1 = dfgmsg.decodePayload<dfgmsg.CardMessage>(
        dc1.firstCall.lastArg.discardPair.cardList[0],
        dfgmsg.CardMessageDecoder
      ) as dfgmsg.CardMessage;
      const dcm2 = dfgmsg.decodePayload<dfgmsg.CardMessage>(
        dc2.firstCall.lastArg.discardPair.cardList[0],
        dfgmsg.CardMessageDecoder
      ) as dfgmsg.CardMessage;
      expect(dcm1.mark).to.eql(card.mark);
      expect(dcm1.cardNumber).to.eql(card.cardNumber);
      expect(dcm2.mark).to.eql(card.mark);
      expect(dcm2.cardNumber).to.eql(card.cardNumber);
      const activePlayerName = activePlayer === client1 ? "cat" : "dog";
      expect(dc1.firstCall.lastArg.playerName).to.eql(activePlayerName);
      expect(dc2.firstCall.lastArg.playerName).to.eql(activePlayerName);
      // 二人に配って２７枚、１枚出したので、残り２６枚
      expect(dc1.firstCall.lastArg.remainingHandCount).to.eql(26);
      expect(dc2.firstCall.lastArg.remainingHandCount).to.eql(26);
      // 次のプレイヤーにターンが移っているか
      const nextPlayer = activePlayer === client1 ? client2 : client1;
      expect(mrm.getFake(nextPlayer, "YourTurnMessage").calledOnce).to.be.true;
      // カードを出したプレイヤーのDiscardPairListが空リストでアップデートされているか
      expect(dp.calledOnce).to.be.true;
      expect(dp.firstCall.lastArg.discardPairList.length).to.eql(0);
      // カードを出したプレイヤーの手札が更新されているか(実は全員分を更新しているけれどご愛敬)
      expect(cl.calledOnce).to.be.true;
    });

    it("updates discardStack state after playing a pair of cards", async () => {
      const room = await colyseus.createRoom("game_room", {});
      setRoomOptionsForTest(room, true);
      const mrm = new MessageReceiverMap();
      const client1 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("cat")
      );
      mrm.registerFake([client1], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      const client2 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("dog")
      );
      mrm.registerFake([client2], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      mrm.registerFake(
        [client1, client2],
        [
          "PlayerLeftMessage",
          "InitialInfoMessage",
          "CardsProvidedMessage",
          "CardListMessage",
          "TurnMessage",
          "YourTurnMessage",
          "DiscardPairListMessage",
          "DiscardMessage",
        ]
      );
      client1.send("GameStartRequest");
      await forMilliseconds(300);
      mrm.resetHistory();
      const activePlayer = getActivePlayer(room, client1, client2);
      const msg = dfgmsg.encodeCardSelectRequest(0);
      activePlayer.send("CardSelectRequest", msg);
      await forMilliseconds(100);
      const cl = mrm.getFake(activePlayer, "CardListMessage");
      expect(cl.calledOnce).to.be.true;
      const dp = mrm.getFake(activePlayer, "DiscardPairListMessage"); // eslint-disable-line @typescript-eslint/no-unsafe-assignment
      expect(dp.calledOnce).to.be.true;
      mrm.resetHistory();
      expect(room.state.discardStack.length).to.eql(0);
      activePlayer.send("DiscardRequest", dfgmsg.encodeDiscardRequest(0));
      await forMilliseconds(100);
      expect(room.state.discardStack.length).to.eql(1);
    });

    it("does nothing when the game is not active", async () => {
      const room = await colyseus.createRoom("game_room", {});
      setRoomOptionsForTest(room, true);
      const mrm = new MessageReceiverMap();
      const client1 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("cat")
      );
      mrm.registerFake([client1], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      const client2 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("dog")
      );
      mrm.registerFake([client2], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      mrm.registerFake(
        [client1, client2],
        [
          "PlayerLeftMessage",
          "InitialInfoMessage",
          "CardsProvidedMessage",
          "CardListMessage",
          "TurnMessage",
          "YourTurnMessage",
          "DiscardPairListMessage",
          "DiscardMessage",
        ]
      );
      client1.send("DiscardRequest", dfgmsg.encodeDiscardRequest(0));
      await forMilliseconds(100);
      const dc1 = mrm.getFake(client1, "DiscardMessage");
      const dc2 = mrm.getFake(client2, "DiscardMessage");
      expect(dc1.called).to.be.false;
      expect(dc2.called).to.be.false;
    });

    it("does nothing when the player is not active at the moment", async () => {
      const room = await colyseus.createRoom("game_room", {});
      setRoomOptionsForTest(room, true);
      const mrm = new MessageReceiverMap();
      const client1 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("cat")
      );
      mrm.registerFake([client1], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      const client2 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("dog")
      );
      mrm.registerFake([client2], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      mrm.registerFake(
        [client1, client2],
        [
          "PlayerLeftMessage",
          "InitialInfoMessage",
          "CardsProvidedMessage",
          "CardListMessage",
          "TurnMessage",
          "YourTurnMessage",
          "DiscardPairListMessage",
          "DiscardMessage",
        ]
      );
      client1.send("GameStartRequest");
      await forMilliseconds(300);
      mrm.resetHistory();
      const inactivePlayer =
        getActivePlayer(room, client1, client2) === client1 ? client2 : client1;
      inactivePlayer.send("DiscardRequest", dfgmsg.encodeDiscardRequest(0));
      await forMilliseconds(100);
      const dc1 = mrm.getFake(client1, "DiscardMessage");
      const dc2 = mrm.getFake(client2, "DiscardMessage");
      expect(dc1.called).to.be.false;
      expect(dc2.called).to.be.false;
    });

    it("does nothing when no cards are selected or there's no available discard pairs", async () => {
      const room = await colyseus.createRoom("game_room", {});
      setRoomOptionsForTest(room, true);
      const mrm = new MessageReceiverMap();
      const client1 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("cat")
      );
      mrm.registerFake([client1], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      const client2 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("dog")
      );
      mrm.registerFake([client2], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      mrm.registerFake(
        [client1, client2],
        [
          "PlayerLeftMessage",
          "InitialInfoMessage",
          "CardsProvidedMessage",
          "CardListMessage",
          "TurnMessage",
          "YourTurnMessage",
          "DiscardPairListMessage",
          "DiscardMessage",
        ]
      );
      client1.send("GameStartRequest");
      await forMilliseconds(300);
      mrm.resetHistory();
      const activePlayer = getActivePlayer(room, client1, client2);
      activePlayer.send("DiscardRequest", dfgmsg.encodeDiscardRequest(0));
      await forMilliseconds(100);
      const dc1 = mrm.getFake(client1, "DiscardMessage");
      const dc2 = mrm.getFake(client2, "DiscardMessage");
      expect(dc1.called).to.be.false;
      expect(dc2.called).to.be.false;
    });

    it("can pass", async () => {
      const room = await colyseus.createRoom("game_room", {});
      setRoomOptionsForTest(room, true);
      const mrm = new MessageReceiverMap();
      const client1 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("cat")
      );
      mrm.registerFake([client1], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      const client2 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("dog")
      );
      mrm.registerFake([client2], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      mrm.registerFake(
        [client1, client2],
        [
          "PlayerLeftMessage",
          "InitialInfoMessage",
          "CardsProvidedMessage",
          "CardListMessage",
          "TurnMessage",
          "YourTurnMessage",
          "DiscardPairListMessage",
          "PassMessage",
        ]
      );
      client1.send("GameStartRequest");
      await forMilliseconds(300);
      mrm.resetHistory();
      const activePlayer = getActivePlayer(room, client1, client2);
      mrm.resetHistory();
      activePlayer.send("PassRequest", "");
      await forMilliseconds(100);
      const dp = mrm.getFake(activePlayer, "DiscardPairListMessage");
      const ps1 = mrm.getFake(client1, "PassMessage");
      const ps2 = mrm.getFake(client2, "PassMessage");
      expect(ps1.calledOnce).to.be.true;
      expect(ps2.calledOnce).to.be.true;
      const activePlayerName = activePlayer === client1 ? "cat" : "dog";
      expect(ps1.firstCall.lastArg.playerName).to.eql(activePlayerName);
      expect(ps2.firstCall.lastArg.playerName).to.eql(activePlayerName);
      // 次のプレイヤーにターンが移っているか
      const nextPlayer = activePlayer === client1 ? client2 : client1;
      expect(mrm.getFake(nextPlayer, "YourTurnMessage").calledOnce).to.be.true;
      // パスをしたプレイヤーのカード候補情報がリセットされているか
      expect(dp.calledOnce).to.be.true;
      expect(dp.firstCall.firstArg.discardPairList.length).to.eql(0);
    });

    it("does nothing when the game is not active", async () => {
      const room = await colyseus.createRoom("game_room", {});
      setRoomOptionsForTest(room, true);
      const mrm = new MessageReceiverMap();
      const client1 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("cat")
      );
      mrm.registerFake([client1], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      const client2 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("dog")
      );
      mrm.registerFake([client2], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      mrm.registerFake(
        [client1, client2],
        [
          "PlayerLeftMessage",
          "InitialInfoMessage",
          "CardsProvidedMessage",
          "CardListMessage",
          "TurnMessage",
          "YourTurnMessage",
          "PassMessage",
        ]
      );
      client1.send("PassRequest", "");
      await forMilliseconds(100);
      const ps1 = mrm.getFake(client1, "PassMessage");
      const ps2 = mrm.getFake(client2, "PassMessage");
      expect(ps1.called).to.be.false;
      expect(ps2.called).to.be.false;
    });

    it("does nothing when the player is not active at the moment", async () => {
      const room = await colyseus.createRoom("game_room", {});
      setRoomOptionsForTest(room, true);
      const mrm = new MessageReceiverMap();
      const client1 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("cat")
      );
      mrm.registerFake([client1], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      const client2 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("dog")
      );
      mrm.registerFake([client2], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      mrm.registerFake(
        [client1, client2],
        [
          "PlayerLeftMessage",
          "InitialInfoMessage",
          "CardsProvidedMessage",
          "CardListMessage",
          "TurnMessage",
          "YourTurnMessage",
          "PassMessage",
        ]
      );
      client1.send("GameStartRequest");
      await forMilliseconds(300);
      mrm.resetHistory();
      const inactivePlayer =
        getActivePlayer(room, client1, client2) === client1 ? client2 : client1;
      inactivePlayer.send("PassRequest", "");
      await forMilliseconds(100);
      const ps1 = mrm.getFake(client1, "PassMessage");
      const ps2 = mrm.getFake(client2, "PassMessage");
      expect(ps1.called).to.be.false;
      expect(ps2.called).to.be.false;
    });

    it("the player who left is kicked", async () => {
      const room = await colyseus.createRoom("game_room", {});
      const mrm = new MessageReceiverMap();
      const client1 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("cat")
      );
      mrm.registerFake([client1], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      const client2 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("dog")
      );
      mrm.registerFake([client2], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      mrm.registerFake(
        [client1, client2],
        [
          "PlayerLeftMessage",
          "InitialInfoMessage",
          "CardsProvidedMessage",
          "CardListMessage",
          "TurnMessage",
          "YourTurnMessage",
          "DiscardPairListMessage",
          "PlayerKickedMessage",
          "PlayerRankChangedMessage",
          "GameEndMessage",
        ]
      );
      client1.send("GameStartRequest");
      await forMilliseconds(300);
      mrm.resetHistory();
      const msg1 = dfgmsg.encodePlayerKickedMessage("dog");
      void client2.leave(true);
      await forMilliseconds(100);
      const k = mrm.getFake(client1, "PlayerKickedMessage");
      expect(k.calledOnce).to.be.true;
      expect(k.firstCall.lastArg).to.eql(msg1);
      expect(mrm.getFake(client1, "GameEndMessage").calledOnce).to.be.true;
      const msg2 = dfgmsg.encodePlayerRankChangedMessage(
        "cat",
        dfgmsg.RankType.UNDETERMINED,
        dfgmsg.RankType.DAIFUGO
      );
      const rc = mrm.getFake(client1, "PlayerRankChangedMessage");
      expect(rc.calledOnce).to.be.true;
      expect(rc.firstCall.lastArg).to.eql(msg2);
    });

    it("kicking a player updates removed cards list, if the game continues", async () => {
      const room = await colyseus.createRoom("game_room", {});
      const mrm = new MessageReceiverMap();
      const client1 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("cat")
      );
      mrm.registerFake([client1], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      const client2 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("dog")
      );
      mrm.registerFake([client2], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      const client3 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("rabbit")
      );
      mrm.registerFake([client3], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      mrm.registerFake(
        [client1, client2, client3],
        [
          "PlayerLeftMessage",
          "InitialInfoMessage",
          "CardsProvidedMessage",
          "CardListMessage",
          "TurnMessage",
          "YourTurnMessage",
          "DiscardPairListMessage",
          "PlayerKickedMessage",
          "PlayerRankChangedMessage",
          "GameEndMessage",
        ]
      );
      client1.send("GameStartRequest");
      await forMilliseconds(300);
      mrm.resetHistory();
      void client2.leave(true);
      await forMilliseconds(100);
      expect(room.state.removedCardList.length).above(0);
    });

    it("can process agari", async () => {
      const room = (await colyseus.createRoom("game_room", {})) as GameRoom;
      const mrm = new MessageReceiverMap();
      const client1 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("cat")
      );
      mrm.registerFake([client1], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      const client2 = await colyseus.connectTo(
        room,
        clientOptionsWithDefault("dog")
      );
      mrm.registerFake([client2], ["RoomOwnerMessage", "PlayerJoinedMessage"]);
      mrm.registerFake(
        [client1, client2],
        [
          "PlayerLeftMessage",
          "InitialInfoMessage",
          "CardsProvidedMessage",
          "CardListMessage",
          "TurnMessage",
          "YourTurnMessage",
          "DiscardPairListMessage",
          "PlayerKickedMessage",
          "PlayerRankChangedMessage",
          "DiscardMessage",
          "AgariMessage",
          "GameEndMessage",
        ]
      );
      const g = createGameBeforeAgari(
        client1,
        client2,
        room.dfgHandler.eventReceiver
      );
      room.dfgHandler.game = g;
      room.dfgHandler.prepareNextPlayer();
      room.dfgHandler.selectCardByIndex(0);
      await forMilliseconds(100);
      mrm.resetHistory();
      client1.send("DiscardRequest", dfgmsg.encodeDiscardRequest(0));
      await forMilliseconds(100);
      const ag1 = mrm.getFake(client1, "AgariMessage");
      const ag2 = mrm.getFake(client2, "AgariMessage");
      expect(ag1.calledOnce).to.be.true;
      expect(ag2.calledOnce).to.be.true;
      const agmsg = dfgmsg.encodeAgariMessage("cat");
      expect(ag1.firstCall.lastArg).to.eql(agmsg);
      expect(ag2.firstCall.lastArg).to.eql(agmsg);
      const endmsg = dfgmsg.encodeGameEndMessage(["cat"], [], [], [], ["dog"]);
      const end1 = mrm.getFake(client1, "GameEndMessage");
      const end2 = mrm.getFake(client2, "GameEndMessage");
      expect(end1.calledOnce).to.be.true;
      expect(end2.calledOnce).to.be.true;
      expect(end1.firstCall.lastArg).to.eql(endmsg);
      expect(end2.firstCall.lastArg).to.eql(endmsg);
      // 次のプレイヤーにターンが回っていないことを見る
      expect(mrm.getFake(client2, "YourTurnMessage").called).to.be.false;
      // lastGameResultのstateが更新されていることを見る
      expect(Array.from(room.state.lastGameResult.daifugoPlayerList)).to.eql([
        "cat",
      ]);
      expect(Array.from(room.state.lastGameResult.fugoPlayerList)).to.eql([]);
      expect(Array.from(room.state.lastGameResult.heiminPlayerList)).to.eql([]);
      expect(Array.from(room.state.lastGameResult.hinminPlayerList)).to.eql([]);
      expect(Array.from(room.state.lastGameResult.daihinminPlayerList)).to.eql([
        "dog",
      ]);
    });
  });
});
