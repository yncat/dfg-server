import { Schema, type } from "@colyseus/schema";

export class GameState extends Schema {
  @type("number") playerCount = 0;
}
