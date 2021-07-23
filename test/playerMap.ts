import { expect } from "chai";
import { PlayerMap } from "../src/logic/playerMap";
import { Client } from "colyseus";

describe("PlayerMap", () => {
  it("can add player and get the info", () => {
    const pm = new PlayerMap();
    const client1 = <Client>{ id: "1" };
    pm.add(client1, "cat");
    expect(pm.client2player(client1)).to.eql("cat");
  });

  it("returns empty string when not found", () => {
    const pm = new PlayerMap();
    const client1 = <Client>{ id: "1" };
    expect(pm.client2player(client1)).to.eql("");
  });

  it("can delete player", () => {
    const pm = new PlayerMap();
    const client1 = <Client>{ id: "1" };
    pm.add(client1, "cat");
    expect(pm.client2player(client1)).to.eql("cat");
    pm.delete(client1);
    expect(pm.client2player(client1)).to.eql("");
  });
});
