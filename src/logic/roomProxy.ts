import { Room } from "colyseus";
import { Schema } from "@colyseus/schema";

// Colyseus.roomへの直接の呼び出しを避けることで、テストを書きやすいようにするためのプロキシ。

export class RoomProxy<T extends Schema> {
  room: Room<T> | null;
  constructor(room: Room<T> | null = null) {
    this.room = room;
  }

  public broadcast(message: string, obj: any): void {
    if (this.room) {
      this.room.broadcast(message, obj);
    }
  }
}
