import { Schema, type } from "@colyseus/schema";
import { Result} from "./result";

export class GameState extends Schema {
  @type("number") playerCount = 0;
  @type("string") ownerPlayerName = "";
  @type("boolean") isInGame = false;
  @type(Result) lastGameResult = new Result();
  @type(Result) currentGameResult = new Result();
}
