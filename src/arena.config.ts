import Arena from "@colyseus/arena";
import { monitor } from "@colyseus/monitor";
import { Request } from "express";
import { authenticator } from "otplib";

/**
 * Import your Room files
 */
import { GlobalRoom } from "./rooms/global";
import { GameRoom } from "./rooms/game";

export default Arena({
  getId: () => "dfg-server",

  initializeGameServer: (gameServer) => {
    /**
     * Define your room handlers:
     */
    gameServer.define("global_room", GlobalRoom);
    gameServer.define("game_room", GameRoom);
  },

  initializeExpress: (app) => {
    /**
     * Bind your custom express routes here:
     */
    app.get("/", (req, res) => {
      res.send("It's time to kick ass and chew bubblegum!");
    });

    /**
     * Bind @colyseus/monitor
     * It is recommended to protect this route with a password.
     * Read more: https://docs.colyseus.io/tools/monitor/
     */
    app.use("/monitor", (req, res, next) => {
      if (authOK(req)) {
        monitor()(req, res, next);
      } else {
        res.sendFile(__dirname + "/monitor_auth.html");
      }
    });
  },

  beforeListen: () => {
    /**
     * Before before gameServer.listen() is called.
     */
  },
});

function authOK(req: Request) {
  if (!req.query.code) {
    return false;
  }
  return authenticator.check(req.query.code as string, process.env["DFG_OTP_SECRET"]);
}
