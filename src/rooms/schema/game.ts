import { Schema, ArraySchema, type } from "@colyseus/schema";
import { Result } from "./result";
import { DiscardPair } from "./discardPair";
import { RemovedCardEntry } from "./removedCardEntry";

export class GameState extends Schema {
  @type("number") playerCount = 0;
  @type(["string"]) playerNameList = new ArraySchema<string>();
  @type("string") ownerPlayerName = "";
  @type("boolean") isInGame = false;
  @type(Result) lastGameResult = new Result();
  @type(Result) currentGameResult = new Result();
  @type([DiscardPair]) discardPair = new ArraySchema<DiscardPair>();
  @type([RemovedCardEntry]) removedCardList =
    new ArraySchema<RemovedCardEntry>();
}
