import Arena from "@colyseus/arena";

/**
 * Import your Room files
 */
import { GlobalRoom } from "./rooms/global";
import { GameRoom } from "./rooms/game";
import { reportTextWithDefaultReporter } from "./logic/errorReporter";

export default Arena({
  getId: () => "dfg-server",

  initializeGameServer: (gameServer) => {
    reportTextWithDefaultReporter("Server is starting...");
    /**
     * Define your room handlers:
     */
    gameServer.define("global_room", GlobalRoom);
    gameServer.define("game_room", GameRoom);
    gameServer.onShutdown(() => {
      return reportTextWithDefaultReporter("Server is shutting down...");
    });
  },

  initializeExpress: (app) => {
    /**
     * Bind your custom express routes here:
     */
    app.get("/", (req, res) => {
      res.send(
        "Meow meow meowwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww!!!!!!!!!!!!"
      );
    });

    /**
     * Bind @colyseus/monitor
     * It is recommended to protect this route with a password.
     * Read more: https://docs.colyseus.io/tools/monitor/
     */
    // app.use("/monitor", monitor());
  },

  beforeListen: () => {
    /**
     * Before before gameServer.listen() is called.
     */
  },
});
