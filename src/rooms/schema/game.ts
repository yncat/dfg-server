import { Schema, ArraySchema, type } from "@colyseus/schema";
import { Result } from "./result";

export class GameState extends Schema {
  @type("number") playerCount = 0;
  @type(["string"]) playerNameList = new ArraySchema<string>();
  @type("string") ownerPlayerName = "";
  @type("boolean") isInGame = false;
  @type(Result) lastGameResult = new Result();
  @type(Result) currentGameResult = new Result();
}
