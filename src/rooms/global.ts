import { Room, Client, ServerError } from "colyseus";
import http from "http";

export class GlobalRoom extends Room {
  onCreate (options: any) {
    this.onMessage("chat", (client, message) => {
      //
      // handle "chat" message
      //
    });
  }

  onAuth(client:Client,options:any,request:http.IncomingMessage):boolean{
    if(!options.playerName){
      throw new ServerError(403,"player name is not given");
    }
    return true;
  }

  onJoin (client: Client, options: any) {
  }

  onLeave (client: Client, consented: boolean) {
  }

  onDispose() {
  }

}
