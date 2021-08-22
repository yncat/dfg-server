import { expect } from "chai";
import { ChatHandler } from "../src/logic/chatHandler";
import * as dfgmsg from "dfg-messages";

describe("ChatHandler", () => {
  it("can generate chat message from request and player name", () => {
    const req = dfgmsg.encodeChatRequest("test");
    const msg = new ChatHandler().generateChatMessage(req, "cat");
    expect(msg.playerName).to.eql("cat");
    expect(msg.message).to.eql("test");
  });
});
