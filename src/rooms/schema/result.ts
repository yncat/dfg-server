import { Schema, ArraySchema, type } from "@colyseus/schema";

export class Result extends Schema {
  @type(["string"]) daifugoPlayerNames = new ArraySchema<string>();
  @type(["string"]) fugoPlayerNames = new ArraySchema<string>();
  @type(["string"]) heiminPlayerNames = new ArraySchema<string>();
  @type(["string"]) hinminPlayerNames = new ArraySchema<string>();
  @type(["string"]) daihinminPlayerNames = new ArraySchema<string>();
}
