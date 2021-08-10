import * as dfg from "dfg-simulator";
import sinon from "sinon";
import { expect } from "chai";
import { EventReceiver } from "../src/logic/eventReceiver";
import { RoomProxy } from "../src/logic/roomProxy";
import { GameState } from "../src/rooms/schema/game";
import { Player } from "../src/logic/player";
import { PlayerMap } from "../src/logic/playerMap";
import * as dfgmsg from "../msg-src/dfgmsg";

function createEventReceiver(): EventReceiver {
  return new EventReceiver(new RoomProxy<GameState>());
}

describe("onNagare", () => {
  it("sends NagareMessage to everyone", () => {
    const er = createEventReceiver();
    const roomProxyMock = sinon.mock(er.roomProxy);
    roomProxyMock.expects("broadcast").calledWithExactly("NagareMessage", "");
    er.onNagare();
    roomProxyMock.verify();
  });
});
