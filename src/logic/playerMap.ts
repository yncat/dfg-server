import { Player } from "./player";

export class PlayerNotFoundError extends Error {}
export class PlayerMap {
  clientPlayerMap: Map<string, Player>;
  constructor() {
    this.clientPlayerMap = new Map();
  }

  public add(clientID: string, player: Player):void {
    this.clientPlayerMap.set(clientID, player);
  }

  public delete(clientID: string):void {
    this.clientPlayerMap.delete(clientID);
  }

  public clientIDToPlayer(clientID: string): Player {
    const ret = this.clientPlayerMap.get(clientID);
    if (ret === undefined) {
      throw new PlayerNotFoundError("player is not in PlayerMap");
    }
    return ret;
  }
}
