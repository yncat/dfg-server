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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function dummyMessageHandler(message: any) {}

function forMilliseconds(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const cfn1 = sinon.fake((message: any) => {});
      client1.onMessage("ChatMessage", cfn1);
      const client2 = await colyseus.connectTo(room, { playerName: "dog" });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const cfn2 = sinon.fake((message: any) => {});
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const clbk = sinon.fake((message: any) => {});
      const client1 = await colyseus.connectTo(room, { playerName: "cat" });
      client1.onMessage("GameMasterMessage", clbk);
      client1.onMessage("PlayerJoinedMessage", dummyMessageHandler);
      expect(client1.sessionId).to.eql(room.clients[0].sessionId);
    });

    it("send GameMasterMessage to the first connected player", async () => {
      const room = await colyseus.createRoom("game_room", {});
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const clbk = sinon.fake((message: any) => {});
      const client1 = await colyseus.connectTo(room, { playerName: "cat" });
      client1.onMessage("GameMasterMessage", clbk);
      await client1.waitForMessage("GameMasterMessage");
      expect(clbk.called).to.be.true;
    });

    it("broadcast PlayerJoinedMessage when second player joins", async () => {
      const room = await colyseus.createRoom("game_room", {});
      const client1 = await colyseus.connectTo(room, { playerName: "cat" });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const cfn1 = sinon.fake((message: any) => {});
      client1.onMessage("PlayerJoinedMessage", cfn1);
      client1.onMessage("GameMasterMessage", dummyMessageHandler);
      const client2 = await colyseus.connectTo(room, { playerName: "dog" });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const cfn2 = sinon.fake((message: any) => {});
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      client1.onMessage("PlayerJoinedMessage", dummyMessageHandler);
      client1.onMessage("GameMasterMessage", dummyMessageHandler);
      const client2 = await colyseus.connectTo(room, { playerName: "dog" });
      client2.onMessage("PlayerJoinedMessage", dummyMessageHandler);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const disconnected = sinon.fake((code: number) => {});
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const masterDisconnectedMessage = sinon.fake((message: any) => {});
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const cfn1 = sinon.fake((message: any) => {});
      client1.onMessage("ChatMessage", cfn1);
      const client2 = await colyseus.connectTo(room, { playerName: "dog" });
      client2.onMessage("PlayerJoinedMessage", dummyMessageHandler);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const cfn2 = sinon.fake((message: any) => {});
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
      const client1 = await colyseus.connectTo(room, { playerName: "cat" });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const fk = sinon.fake((message: any) => {});
      client1.onMessage("PlayerJoinedMessage", fk);
      client1.onMessage("GameMasterMessage", fk);
      const ii1 = sinon.fake((message: any) => {});
      const cp1 = sinon.fake((message: any) => {});
      const cl1 = sinon.fake((message: any) => {});
      client1.onMessage("InitialInfoMessage", ii1);
      client1.onMessage("CardsProvidedMessage", cp1);
      client1.onMessage("CardListMessage", cl1);
      const client2 = await colyseus.connectTo(room, { playerName: "dog" });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      client2.onMessage("PlayerJoinedMessage", fk);
      const ii2 = sinon.fake((message: any) => {});
      const cp2 = sinon.fake((message: any) => {});
      const cl2 = sinon.fake((message: any) => {});
      client2.onMessage("InitialInfoMessage", ii2);
      client2.onMessage("CardsProvidedMessage", cp2);
      client2.onMessage("CardListMessage", cl2);
      client1.send("GameStartRequest");
      await forMilliseconds(300);
      expect(ii1.calledOnce).to.be.true;
      expect(ii2.calledOnce).to.be.true;
      expect(ii1.firstCall.firstArg.playerCount).to.eql(2);
      expect(ii1.firstCall.firstArg.deckCount).to.eql(1);
      expect(ii2.firstCall.firstArg.playerCount).to.eql(2);
      expect(ii2.firstCall.firstArg.deckCount).to.eql(1);
      expect(cp1.calledTwice).to.be.true;
      expect(cp2.calledTwice).to.be.true;
      expect(cp1.firstCall.firstArg.cardCount).to.eql(27);
      expect(cp1.secondCall.firstArg.cardCount).to.eql(27);
      expect(cp2.firstCall.firstArg.cardCount).to.eql(27);
      expect(cp2.secondCall.firstArg.cardCount).to.eql(27);
      expect(cl1.calledOnce).to.be.true;
      expect(cl2.calledOnce).to.be.true;
    });
  });
});
