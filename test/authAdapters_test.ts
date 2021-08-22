import { expect } from "chai";
import * as AuthAdapters from "../src/logic/authAdapters";

describe("nameOnlyAdapter", () => {
  it("returns true when player name is given", () => {
    const adapter = new AuthAdapters.nameOnlyAdapter();
    const clientOptions = { playerName: "cat" };
    expect(adapter.authorize(clientOptions)).to.be.true;
  });

  it("returns false when player name is not given", () => {
    const adapter = new AuthAdapters.nameOnlyAdapter();
    const clientOptions = {};
    expect(adapter.authorize(clientOptions)).to.be.false;
  });

  it("returns true when player name is an empty string", () => {
    const adapter = new AuthAdapters.nameOnlyAdapter();
    const clientOptions = { playerName: "" };
    expect(adapter.authorize(clientOptions)).to.be.false;
  });
});
