import sinon from "sinon";
import { expect } from "chai";
import * as dfgmsg from "dfg-messages";
import { EditableMetadata } from "../src/logic/editableMetadata";

describe("EditableMetadata", () => {
  it("Can set a default value and return metadata", () => {
    const md = dfgmsg.encodeGameRoomMetadata("cat", dfgmsg.RoomState.WAITING);
    const emd = new EditableMetadata<dfgmsg.GameRoomMetadata>(md);
    expect(emd.produce()).to.eql(md);
  });

  it("Can edit values and return metadata", () => {
    const md = dfgmsg.encodeGameRoomMetadata("cat", dfgmsg.RoomState.WAITING);
    const emd = new EditableMetadata<dfgmsg.GameRoomMetadata>(md);
    emd.values.owner = "dog";
    emd.values.roomState = dfgmsg.RoomState.PLAYING;
    const want = dfgmsg.encodeGameRoomMetadata("dog", dfgmsg.RoomState.PLAYING);
    expect(emd.produce()).to.eql(want);
  });
});
