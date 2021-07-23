import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import { ColyseusTestServer, boot } from "@colyseus/testing";
// import your "arena.config.ts" file here.
import appConfig from "../src/arena.config";
import { ServerError } from "colyseus";

chai.use(chaiAsPromised);

describe("testing your Colyseus app", () => {
  let colyseus: ColyseusTestServer;

  before(async () => (colyseus = await boot(appConfig)));
  after(async () => colyseus.shutdown());

  beforeEach(async () => await colyseus.cleanup());

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
    try{
      const ret = await colyseus.connectTo(room)
    }catch(e){
      expect(e.code).to.eql(403);
    }
  });
});
