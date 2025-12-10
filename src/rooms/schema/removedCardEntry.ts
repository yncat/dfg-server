import { Schema } from "@colyseus/schema";

export class RemovedCardEntry extends Schema {
  @type("number") mark = 0;
  @type("number") cardNumber = 0;
  @type("number") count = 0;
}
