import * as dfg from "dfg-simulator";
import * as dfgmsg from "../../msg-src/dfgmsg";
import { RoomProxy } from "./roomProxy";
import { GameState } from "../rooms/schema/game";
import { PlayerMap } from "./playerMap";

export class EventReceiver implements dfg.EventReceiver {
  roomProxy: RoomProxy<GameState>;
  playerMap: PlayerMap;
  constructor(roomProxy: RoomProxy<GameState>, playerMap: PlayerMap) {
    this.roomProxy = roomProxy;
    this.playerMap = playerMap;
  }

  public onNagare(): void {
    this.roomProxy.broadcast("NagareMessage", "");
  }

  public onAgari(identifier: string): void {
    this.roomProxy.broadcast(
      "AgariMessage",
      dfgmsg.encodeAgariMessage(
        this.playerMap.clientIDToPlayer(identifier).name
      )
    );
  }

  public onForbiddenAgari(identifier: string): void {
    this.roomProxy.broadcast(
      "ForbiddenAgariMessage",
      dfgmsg.encodeForbiddenAgariMessage(
        this.playerMap.clientIDToPlayer(identifier).name
      )
    );
  }

  public onYagiri(identifier: string): void {
    this.roomProxy.broadcast("YagiriMessage", "");
  }

  public onJBack(identifier: string): void {
    this.roomProxy.broadcast("JBackMessage", "");
  }

  public onKakumei(identifier: string): void {
    this.roomProxy.broadcast("KakumeiMessage", "");
  }

  public onStrengthInversion(strengthInverted: boolean): void {
    this.roomProxy.broadcast(
      "StrengthInversionMessage",
      dfgmsg.encodeStrengthInversionMessage(strengthInverted)
    );
  }

  public onDiscard(
    identifier: string,
    discardPair: dfg.DiscardPair,
    remainingHandCount: number
  ): void {
    this.roomProxy.broadcast(
      "DiscardMessage",
      dfgmsg.encodeDiscardMessage(
        this.playerMap.clientIDToPlayer(identifier).name,
        dfgmsg.encodeDiscardPairMessage(
          discardPair.cards.map((v) => {
            return dfgmsg.encodeCardMessage(v.mark, v.cardNumber);
          })
        ),
        remainingHandCount
      )
    );
  }

  public onPass(identifier: string): void {
    this.roomProxy.broadcast(
      "PassMessage",
      dfgmsg.encodePassMessage(
        this.playerMap.clientIDToPlayer(identifier).name
      )
    );
  }

  public onGameEnd(): void {
    console.log("onGameEnd");
  }

  public onPlayerKicked(identifier: string): void {
    console.log("onPlayerKicked");
  }

  public onPlayerRankChanged(
    identifier: string,
    before: dfg.RankType,
    after: dfg.RankType
  ): void {
    console.log("onPlayerRankChanged");
  }

  public onInitialInfoProvided(playerCount: number, deckCount: number): void {
    console.log("onInitialInfoProvided");
  }

  public onCardsProvided(identifier: string, providedCount: number): void {
    console.log("onCardProvided");
  }
}
