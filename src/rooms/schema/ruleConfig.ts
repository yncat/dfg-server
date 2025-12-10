import { Schema } from "@colyseus/schema";

export class RuleConfig extends Schema {
  @type("boolean") yagiri = false;
  @type("boolean") jBack = false;
  @type("boolean") kakumei = false;
  @type("boolean") reverse = false;
  @type("uint8") skip = 0;
  @type("boolean") transfer = false;
  @type("boolean") exile = false;
}
