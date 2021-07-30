import { expect } from "chai";
import { Room } from "colyseus";
import { RoomProxy } from "../src/logic/roomProxy";

describe("RoomProxy", () => {
  it("can be instantiated with colyseus room", () => {
    const rm = <Room>{};
    const rp = new RoomProxy(rm);
    expect(rp).not.to.be.null;
  });

  it("can be instantiated without room", () => {
    const rp = new RoomProxy();
    expect(rp).not.to.be.null;
  });
});
