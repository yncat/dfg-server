import { Schema, type } from "@colyseus/schema";

export class EventLog extends Schema {
  @type("string") type = "";
  @type("string") body = "";
}
