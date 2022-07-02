import { expect } from "chai";
import { PlayerMap } from "../src/logic/playerMap";
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
    }).to.throw("player 1 is not in PlayerMap");
  });

  it("can delete player", () => {
    const pm = new PlayerMap();
    pm.add("1", new Player("cat"));
    expect(pm.clientIDToPlayer("1").name).to.eql("cat");
    pm.delete("1");
    expect(() => {
      pm.clientIDToPlayer("1");
    }).to.throw("player 1 is not in PlayerMap");
  });

  it("can add and enumerate players", () => {
    const pm = new PlayerMap();
    pm.add("1", new Player("cat"));
    pm.add("2", new Player("dog"));
    const ps:Player[] = [];
    pm.forEach((identifier, player) => {
      ps.push(player);
    });
    expect(ps[0].name).to.eql("cat");
    expect(ps[1].name).to.eql("dog");
  });
});
