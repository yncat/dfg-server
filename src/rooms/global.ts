import { Room, Client } from "colyseus";

export class GlobalRoom extends Room {
  onCreate (options: any) {
    this.onMessage("chat", (client, message) => {
      //
      // handle "chat" message
      //
    });

  }

  onJoin (client: Client, options: any) {
  }

  onLeave (client: Client, consented: boolean) {
  }

  onDispose() {
  }

}
