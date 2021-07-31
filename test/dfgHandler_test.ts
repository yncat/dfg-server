import sinon from "sinon";
import { expect } from "chai";
import { DFGHandler, EventReceiver } from "../src/logic/dfgHandler";
import { RoomProxy } from "../src/logic/roomProxy";
import { GameState } from "../src/rooms/schema/game";

function createDFGHandler(): DFGHandler {
  const rp = new RoomProxy<GameState>();
  const h = new DFGHandler(rp);
  return h;
}

describe("DFGHandler", () => {
  it("can be instantiated", () => {
    const h = createDFGHandler();
    expect(h).not.to.be.null;
  });

  it("can start a game", () => {
    const h = createDFGHandler();
    const eventReceiverMock = sinon.mock(h.eventReceiver);
    eventReceiverMock.expects("onInitialInfoProvided").once();
    eventReceiverMock.expects("onCardsProvided").thrice();
    const cardEnumeratorMock = sinon.mock(h.cardEnumerator);
    cardEnumeratorMock.expects("enumerate").thrice();
    const roomProxyMock = sinon.mock(h.roomProxy);
    roomProxyMock.expects("send").thrice();
    h.startGame(["a", "b", "c"]);
    eventReceiverMock.verify();
    cardEnumeratorMock.verify();
    roomProxyMock.verify();
  });
});
