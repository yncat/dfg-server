import { ArraySchema, Schema, type } from "@colyseus/schema";
import { Card } from "./card";

export class DiscardPair extends Schema {
  @type([Card]) cards = new ArraySchema<Card>();
}
