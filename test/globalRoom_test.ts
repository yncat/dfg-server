/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import sinon from "sinon";
import { expect } from "chai";
import { ColyseusTestServer, boot } from "@colyseus/testing";
// import your "arena.config.ts" file here.
import appConfig from "../src/arena.config";
import * as dfgmsg from "../msg-src/dfgmsg";

describe("testing your Colyseus app", () => {
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

    it("reject connection when player name is not given", async () => {
      const room = await colyseus.createRoom("global_room", {});
      try {
        await colyseus.connectTo(room);
      } catch (e) {
        expect(e.code).to.eql(403);
      }
    });

    it("handle chat message", async () => {
      const room = await colyseus.createRoom("global_room", {});
      const client1 = await colyseus.connectTo(room, { playerName: "cat" });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const cfn1 = sinon.fake((message: any) => {});
      client1.onMessage("chatMessage", cfn1);
      const client2 = await colyseus.connectTo(room, { playerName: "dog" });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const cfn2 = sinon.fake((message: any) => {});
      client2.onMessage("chatMessage", cfn2);
      client1.send("chatRequest", dfgmsg.encodeChatRequest("hello"));
      await Promise.all([
        client1.waitForMessage("chatMessage"),
        client2.waitForMessage("chatMessage"),
        room.waitForNextPatch(),
      ]);
      const want = { playerName: "cat", message: "hello" };
      expect(cfn1.firstCall.lastArg).to.eql(want);
      expect(cfn2.firstCall.lastArg).to.eql(want);
      expect(client1.state.playerCount).to.eql(2);
      expect(client2.state.playerCount).to.eql(2);
    });
  });
});
