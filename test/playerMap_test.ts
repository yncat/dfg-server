import { expect } from "chai";
import { PlayerMap } from "../src/logic/playerMap";
import { Client } from "colyseus";
import { Player } from "../src/logic/player";

describe("PlayerMap", () => {
  it("can add player and get the info", () => {
    const pm = new PlayerMap();
    pm.add("1", new Player("cat"));
    expect(pm.clientIDToPlayer("1").name).to.eql("cat");
  });

  it("throws an error when player is not found", () => {
    const pm = new PlayerMap();
    expect(() => {
      pm.clientIDToPlayer("1");
    }).to.throw("player is not in PlayerMap");
  });

  it("can delete player", () => {
    const pm = new PlayerMap();
    pm.add("1", new Player("cat"));
    expect(pm.clientIDToPlayer("1").name).to.eql("cat");
    pm.delete("1");
    expect(() => {
      pm.clientIDToPlayer("1");
    }).to.throw("player is not in PlayerMap");
  });
});
