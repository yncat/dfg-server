import { expect } from "chai";
import { createPlayerFromClientOptions } from "../src/logic/player";

describe("Player", () => {
  it("can be created from clientOptions", () => {
    const p = createPlayerFromClientOptions({ playerName: "cat" });
    expect(p.name).to.eql("cat");
  });

  it("throws an error when required parameter is missing", () => {
    expect(() => {
      createPlayerFromClientOptions({});
    }).to.throw("playerName is required");
  });
});
