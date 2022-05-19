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
      "player name is not given"
    );
  });

  it("throws an error when player name is too long", () => {
    const adapter = new AuthAdapters.nameAndVersionAdapter();
    const clientOptions = { playerName: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", protocolVersion: protocolVersion };
    expect(() => {
      adapter.authorize(clientOptions);
    }).to.throw(
      "player name is too long"
    );
  });

  it("throws an error when player name contains 、", () => {
    const adapter = new AuthAdapters.nameAndVersionAdapter();
    const clientOptions = { playerName: "これは、テスト", protocolVersion: protocolVersion };
    expect(() => {
      adapter.authorize(clientOptions);
    }).to.throw(
      "player name includes prohibited characters"
    );
  });

  it("throws an error when player name consists of white spaces only", () => {
    const adapter = new AuthAdapters.nameAndVersionAdapter();
    const clientOptions = { playerName: "    ", protocolVersion: protocolVersion };
    expect(() => {
      adapter.authorize(clientOptions);
    }).to.throw(
      "player name contains prohibited pattern"
    );
  });

  it("throws an error when player name consists of zenkaku white spaces only", () => {
    const adapter = new AuthAdapters.nameAndVersionAdapter();
    const clientOptions = { playerName: "　　　　", protocolVersion: protocolVersion };
    expect(() => {
      adapter.authorize(clientOptions);
    }).to.throw(
      "player name contains prohibited pattern"
    );
  });

  it("throws an error when player name consists of tab only", () => {
    const adapter = new AuthAdapters.nameAndVersionAdapter();
    const clientOptions = { playerName: "\t\t\t\t", protocolVersion: protocolVersion };
    expect(() => {
      adapter.authorize(clientOptions);
    }).to.throw(
      "player name contains prohibited pattern"
    );
  });

  it("throws an error when player name consists of zenkaku and hankaku white spaces", () => {
    const adapter = new AuthAdapters.nameAndVersionAdapter();
    const clientOptions = { playerName: "　　  ", protocolVersion: protocolVersion };
    expect(() => {
      adapter.authorize(clientOptions);
    }).to.throw(
      "player name contains prohibited pattern"
    );
  });

  it("throws an error when player name is an empty string", () => {
    const adapter = new AuthAdapters.nameAndVersionAdapter();
    const clientOptions = { playerName: "", protocolVersion: protocolVersion };
    expect(() => {
      adapter.authorize(clientOptions);
    }).to.throw(
      "player name is not given"
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
