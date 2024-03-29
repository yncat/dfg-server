import { expect } from "chai";
import * as dfgmsg from "dfg-messages";
import { EditableMetadata } from "../src/logic/editableMetadata";

function createRuleConfig() {
  return {
    yagiri: true,
    jBack: true,
    kakumei: true,
    reverse: false,
    skip: dfgmsg.SkipConfig.OFF,
    transfer: false,
    exile: false,
  };
}

describe("EditableMetadata", () => {
  it("Can set a default value and return metadata", () => {
    const md = dfgmsg.encodeGameRoomMetadata(
      "cat",
      dfgmsg.RoomState.WAITING,
      createRuleConfig(),
      ["cat"]
    );
    const emd = new EditableMetadata<dfgmsg.GameRoomMetadata>(md);
    expect(emd.produce()).to.eql(md);
  });

  it("Can edit values and return metadata", () => {
    const md = dfgmsg.encodeGameRoomMetadata(
      "cat",
      dfgmsg.RoomState.WAITING,
      createRuleConfig(),
      ["cat"]
    );
    const emd = new EditableMetadata<dfgmsg.GameRoomMetadata>(md);
    emd.values.owner = "dog";
    emd.values.playerNameList = ["dog"];
    emd.values.roomState = dfgmsg.RoomState.PLAYING;
    const want = dfgmsg.encodeGameRoomMetadata(
      "dog",
      dfgmsg.RoomState.PLAYING,
      createRuleConfig(),
      ["dog"]
    );
    expect(emd.produce()).to.eql(want);
  });
});
