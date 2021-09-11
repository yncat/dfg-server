import { Room, Client } from "colyseus";
import { Schema } from "@colyseus/schema";

// Colyseus.roomへの直接の呼び出しを避けることで、テストを書きやすいようにするためのプロキシ。
// エスケープハッチとして、roomOrNullでルームインスタンスを取得できるが、あまりやってほしくはない。

class ClientNotFoundError extends Error {}

export class RoomProxy<T extends Room<Schema>> {
  private room: T | null;
  constructor(room: T | null = null) {
    this.room = room;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  public broadcast(message: string, obj: any): void {
    if (!this.room) {
      return;
    }
    this.room.broadcast(message, obj);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  public send(clientID: string, type: string, message: any): void {
    if (!this.room) {
      return;
    }
    const c = this.findClientByID(clientID);
    c.send(type, message);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public setMetadata(meta: Partial<any>): void {
    if (!this.room) {
      return;
    }
    void this.room.setMetadata(meta);
  }

  public roomOrNull(): T | null {
    return this.room;
  }

  private findClientByID(clientID: string): Client {
    const cl = this.room.clients.filter((v) => {
      return v.id === clientID;
    });
    if (cl.length == 0) {
      throw new ClientNotFoundError("client " + clientID + " is not found");
    }
    return cl[0];
  }
}
