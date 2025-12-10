import { Schema } from "@colyseus/schema";

export class GlobalState extends Schema {
  @type("number") playerCount = 0;
}
