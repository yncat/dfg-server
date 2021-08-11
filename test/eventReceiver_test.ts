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
  return new EventReceiver(new RoomProxy<GameState>(), new PlayerMap());
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

describe("onAgari", () => {
  it("sends AgariMessage to everyone", () => {
    const pi = "ccaatt";
    const pn = "cat";
    const msg = dfgmsg.encodeAgariMessage(pn);
    const player = <Player>{
      name: pn,
    };
    const er = createEventReceiver();
    const roomProxyMock = sinon.mock(er.roomProxy);
    roomProxyMock.expects("broadcast").calledWithExactly("AgariMessage", msg);
    const c2p = sinon.stub(er.playerMap, "clientIDToPlayer").returns(player);
    er.onAgari(pi);
    expect(c2p.calledWithExactly(pi)).to.be.true;
    roomProxyMock.verify();
  });
});
