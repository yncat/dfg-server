import { Client } from "colyseus";

export class PlayerMap {
  clientPlayerMap: Map<Client, string>;
  constructor() {
    this.clientPlayerMap = new Map();
  }

  public add(client: Client, player: string) {
    this.clientPlayerMap.set(client, player);
  }

  public delete(client: Client) {
    this.clientPlayerMap.delete(client);
  }

  public client2player(client: Client) {
    let ret = this.clientPlayerMap.get(client);
    if (ret === undefined) {
      ret = "";
    }
    return ret;
  }
}
