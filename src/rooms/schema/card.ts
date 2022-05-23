import { Schema, type } from "@colyseus/schema";

export class Card extends Schema {
  @type("number") mark = 0;
  @type("number") cardNumber = 0;
}
