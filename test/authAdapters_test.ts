import { expect } from "chai";
import * as AuthAdapters from "../src/logic/authAdapters";
import { protocolVersion } from "../src/protocolVersion";

describe("nameAndVersionAdapter", () => {
  it("does not throw an error when player name is given", () => {
    const adapter = new AuthAdapters.nameAndVersionAdapter();
    const clientOptions = {
      playerName: "cat",
      protocolVersion: protocolVersion,
    };
    expect(() => {
      adapter.authorize(clientOptions);
    }).not.to.throw();
  });

  it("throws an error when player name is not given", () => {
    const adapter = new AuthAdapters.nameAndVersionAdapter();
    const clientOptions = { protocolVersion: protocolVersion };
    expect(() => {
      adapter.authorize(clientOptions);
    }).to.throw(
      "player name is not given or the specified player name is not allowed"
    );
  });

  it("throws an error when player name is an empty string", () => {
    const adapter = new AuthAdapters.nameAndVersionAdapter();
    const clientOptions = { playerName: "", protocolVersion: protocolVersion };
    expect(() => {
      adapter.authorize(clientOptions);
    }).to.throw(
      "player name is not given or the specified player name is not allowed"
    );
  });

  it("throws an error when protocol version is not given", () => {
    const adapter = new AuthAdapters.nameAndVersionAdapter();
    const clientOptions = {
      playerName: "cat",
    };
    expect(() => {
      adapter.authorize(clientOptions);
    }).to.throw("protocol version mismatch");
  });

  it("throws an error when protocol version is different", () => {
    const adapter = new AuthAdapters.nameAndVersionAdapter();
    const clientOptions = {
      playerName: "cat",
      protocolVersion: 1000000,
    };
    expect(() => {
      adapter.authorize(clientOptions);
    }).to.throw("protocol version mismatch");
  });
});
