import { Room } from "colyseus";
import { GameState } from "./schema/game";
import { EditableMetadata } from "../logic/editableMetadata";
import * as dfgmsg from "dfg-messages";

// logic/dfgHandlerで、RoomProxy<GameRoom>をタイプとして使いたかったが、そのままやるとcircular importになるので、その大作。
// GameRoomの本体はこいつをimplementsに含んでいないが、golangでinterface型キャストができるみたいな要領で使っている。

export interface GameRoom extends Room<GameState> {
  editableMetadata: EditableMetadata<dfgmsg.GameRoomMetadata>;
}
