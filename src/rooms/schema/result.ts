import { Schema, ArraySchema } from "@colyseus/schema";

export class Result extends Schema {
  @type(["string"]) daifugoPlayerList = new ArraySchema<string>();
  @type(["string"]) fugoPlayerList = new ArraySchema<string>();
  @type(["string"]) heiminPlayerList = new ArraySchema<string>();
  @type(["string"]) hinminPlayerList = new ArraySchema<string>();
  @type(["string"]) daihinminPlayerList = new ArraySchema<string>();
}
