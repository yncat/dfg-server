import { Room, Client } from "colyseus";
import { GameState } from "./schema/game";
import { EditableMetadata } from "../logic/editableMetadata";
import * as dfgmsg from "dfg-messages";

export interface GameRoom extends Room<GameState> {
  editableMetadata: EditableMetadata<dfgmsg.GameRoomMetadata>;
}
