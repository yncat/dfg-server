import { expect } from "chai";
import { DFGHandler } from "../src/logic/dfgHandler";
import { RoomProxy } from "../src/logic/roomProxy";
import { GameState } from "../src/rooms/schema/game";

describe("DFGHandler", () => {
  it("can be instantiated", () => {
    const rp = new RoomProxy<GameState>();
    const h = new DFGHandler(rp);
    expect(h).not.to.be.null;
  });
});
