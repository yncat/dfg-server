/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import sinon from "sinon";
import { expect } from "chai";
import { ColyseusTestServer, boot } from "@colyseus/testing";
// import your "arena.config.ts" file here.
import appConfig from "../src/arena.config";
import * as dfgmsg from "../msg-src/dfgmsg";
import { ServerError } from "colyseus";
import { GameRoom } from "../src/rooms/game";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function dummyMessageHandler(message: any) {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createMessageReceiver() {
  return sinon.fake((message: any) => {});
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
    return f;
  }

  public resetHistory() {
    const itr = this.mp.values();
    let f = itr.next();
    while (!f.done) {
      f.value.resetHistory();
      f = itr.next();
    }
  }
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
      const client1 = await colyseus.connectTo(room, { playerName: "cat" });

      // make your assertions
      expect(client1.sessionId).to.eql(room.clients[0].sessionId);
    });

    it("handle chat message", async () => {
      const room = await colyseus.createRoom("global_room", {});
      const client1 = await colyseus.connectTo(room, { playerName: "cat" });
      const cfn1 = createMessageReceiver();
      client1.onMessage("ChatMessage", cfn1);
      const client2 = await colyseus.connectTo(room, { playerName: "dog" });
      const cfn2 = createMessageReceiver();
      client2.onMessage("ChatMessage", cfn2);
      client1.send("chatRequest", dfgmsg.encodeChatRequest("hello"));
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
      const clbk = createMessageReceiver();
      const client1 = await colyseus.connectTo(room, { playerName: "cat" });
      client1.onMessage("GameMasterMessage", clbk);
      client1.onMessage("PlayerJoinedMessage", dummyMessageHandler);
      expect(client1.sessionId).to.eql(room.clients[0].sessionId);
    });

    it("send GameMasterMessage to the first connected player", async () => {
      const room = await colyseus.createRoom("game_room", {});
      const clbk = createMessageReceiver();
      const client1 = await colyseus.connectTo(room, { playerName: "cat" });
      client1.onMessage("GameMasterMessage", clbk);
      await client1.waitForMessage("GameMasterMessage");
      expect(clbk.called).to.be.true;
    });

    it("broadcast PlayerJoinedMessage when second player joins", async () => {
      const room = await colyseus.createRoom("game_room", {});
      const client1 = await colyseus.connectTo(room, { playerName: "cat" });
      const cfn1 = createMessageReceiver();
      client1.onMessage("PlayerJoinedMessage", cfn1);
      client1.onMessage("GameMasterMessage", dummyMessageHandler);
      const client2 = await colyseus.connectTo(room, { playerName: "dog" });
      const cfn2 = createMessageReceiver();
      client2.onMessage("PlayerJoinedMessage", cfn2);
      await Promise.all([
        client1.waitForMessage("PlayerJoinedMessage"),
        client2.waitForMessage("PlayerJoinedMessage"),
        room.waitForNextPatch(),
      ]);
      const want = { playerName: "dog" };
      expect(cfn1.called).to.be.true;
      expect(cfn2.called).to.be.true;
      expect(cfn1.firstCall.lastArg).to.eql(want);
      expect(cfn2.firstCall.lastArg).to.eql(want);
    });

    it("close room when master client disconnects", async () => {
      const room = await colyseus.createRoom("game_room", {});
      const client1 = await colyseus.connectTo(room, { playerName: "cat" });
      client1.onMessage("PlayerJoinedMessage", dummyMessageHandler);
      client1.onMessage("GameMasterMessage", dummyMessageHandler);
      const client2 = await colyseus.connectTo(room, { playerName: "dog" });
      client2.onMessage("PlayerJoinedMessage", dummyMessageHandler);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const disconnected = sinon.fake((code: number) => {});
      const masterDisconnectedMessage = createMessageReceiver();
      client2.onLeave(disconnected);
      client2.onMessage("MasterDisconnectedMessage", masterDisconnectedMessage);
      await Promise.all([
        client1.waitForMessage("PlayerJoinedMessage"),
        client2.waitForMessage("PlayerJoinedMessage"),
        room.waitForNextPatch(),
      ]);
      void client1.leave();
      await client2.waitForMessage("MasterDisconnectedMessage");
      expect(masterDisconnectedMessage.called).to.be.true;
      await forMilliseconds(100);
      expect(disconnected.called).to.be.true;
    });

    it("handle chat message", async () => {
      const room = await colyseus.createRoom("game_room", {});
      const client1 = await colyseus.connectTo(room, { playerName: "cat" });
      client1.onMessage("GameMasterMessage", dummyMessageHandler);
      client1.onMessage("PlayerJoinedMessage", dummyMessageHandler);
      const cfn1 = createMessageReceiver();
      client1.onMessage("ChatMessage", cfn1);
      const client2 = await colyseus.connectTo(room, { playerName: "dog" });
      client2.onMessage("PlayerJoinedMessage", dummyMessageHandler);
      const cfn2 = createMessageReceiver();
      client2.onMessage("ChatMessage", cfn2);
      client1.send("chatRequest", dfgmsg.encodeChatRequest("hello"));
      await Promise.all([
        client1.waitForMessage("ChatMessage"),
        client2.waitForMessage("ChatMessage"),
        room.waitForNextPatch(),
      ]);
      const want = { playerName: "cat", message: "hello" };
      expect(cfn1.firstCall.lastArg).to.eql(want);
      expect(cfn2.firstCall.lastArg).to.eql(want);
    });

    it("game master can start the game", async () => {
      const room = await colyseus.createRoom("game_room", {});
      const mrm = new MessageReceiverMap();
      const client1 = await colyseus.connectTo(room, { playerName: "cat" });
      mrm.registerFake([client1], ["GameMasterMessage", "PlayerJoinedMessage"]);
      const client2 = await colyseus.connectTo(room, { playerName: "dog" });
      mrm.registerFake([client2], ["GameMasterMessage", "PlayerJoinedMessage"]);
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
      const mrm = new MessageReceiverMap();
      const client1 = await colyseus.connectTo(room, { playerName: "cat" });
      mrm.registerFake([client1], ["GameMasterMessage", "PlayerJoinedMessage"]);
      const client2 = await colyseus.connectTo(room, { playerName: "dog" });
      mrm.registerFake([client2], ["GameMasterMessage", "PlayerJoinedMessage"]);
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
      client1.send("GameStartRequest");
      await forMilliseconds(300);
      expect(ii1.calledOnce).to.be.true;
      expect(ii2.calledOnce).to.be.true;
    });

    it("non-game-master cannot start the game", async () => {
      const room = await colyseus.createRoom("game_room", {});
      const client1 = await colyseus.connectTo(room, { playerName: "cat" });
      const fk = createMessageReceiver();
      client1.onMessage("PlayerJoinedMessage", fk);
      client1.onMessage("GameMasterMessage", fk);
      const ii1 = createMessageReceiver();
      const cp1 = createMessageReceiver();
      const cl1 = createMessageReceiver();
      client1.onMessage("InitialInfoMessage", ii1);
      client1.onMessage("CardsProvidedMessage", cp1);
      client1.onMessage("CardListMessage", cl1);
      const client2 = await colyseus.connectTo(room, { playerName: "dog" });
      client2.onMessage("PlayerJoinedMessage", fk);
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

    it("can select a card", async () => {
      const room = await colyseus.createRoom("game_room", {});
      const mrm = new MessageReceiverMap();
      const client1 = await colyseus.connectTo(room, { playerName: "cat" });
      mrm.registerFake([client1], ["GameMasterMessage", "PlayerJoinedMessage"]);
      const client2 = await colyseus.connectTo(room, { playerName: "dog" });
      mrm.registerFake([client2], ["GameMasterMessage", "PlayerJoinedMessage"]);
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
      mrm.resetHistory();
      const activePlayer = getActivePlayer(room, client1, client2);
      const msg = dfgmsg.encodeCardSelectRequest(0);
      activePlayer.send("CardSelectRequest", msg);
      await forMilliseconds(100);
      const cl = mrm.getFake(activePlayer, "CardListMessage");
      expect(cl.calledOnce).to.be.true;
      expect(cl.firstCall.lastArg.cardList[0].isChecked).to.be.true;
      expect(cl.firstCall.lastArg.cardList[0].isCheckable).to.be.true;
    });
  });
});
