import { Client } from "colyseus";
import { Player } from "./player";

export class PlayerNotFoundError extends Error {}
export class PlayerMap {
  clientPlayerMap: Map<Client, Player>;
  constructor() {
    this.clientPlayerMap = new Map();
  }

  public add(client: Client, player: Player) {
    this.clientPlayerMap.set(client, player);
  }

  public delete(client: Client) {
    this.clientPlayerMap.delete(client);
  }

  public client2player(client: Client): Player {
    let ret = this.clientPlayerMap.get(client);
    if (ret === undefined) {
      throw new PlayerNotFoundError("player is not in PlayerMap");
    }
    return ret;
  }
}
