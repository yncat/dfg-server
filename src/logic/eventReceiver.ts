import * as dfg from "dfg-simulator";
import * as dfgmsg from "../../msg-src/dfgmsg";
import { RoomProxy } from "./roomProxy";
import { GameState } from "../rooms/schema/game";
import { PlayerMap } from "./playerMap";

export class EventReceiver implements dfg.EventReceiver {
  roomProxy: RoomProxy<GameState>;
  playerMap: PlayerMap;
  gameEndedCallback: () => void;
  constructor(
    roomProxy: RoomProxy<GameState>,
    playerMap: PlayerMap,
    gameEndedCallback: () => void
  ) {
    this.roomProxy = roomProxy;
    this.playerMap = playerMap;
    this.gameEndedCallback = gameEndedCallback;
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onYagiri(identifier: string): void {
    this.roomProxy.broadcast("YagiriMessage", "");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onJBack(identifier: string): void {
    this.roomProxy.broadcast("JBackMessage", "");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      dfgmsg.encodePassMessage(this.playerMap.clientIDToPlayer(identifier).name)
    );
  }

  public onGameEnd(): void {
    this.roomProxy.broadcast("GameEndMessage", "");
    this.gameEndedCallback();
  }

  public onPlayerKicked(identifier: string): void {
    this.roomProxy.broadcast(
      "PlayerKickedMessage",
      dfgmsg.encodePlayerKickedMessage(
        this.playerMap.clientIDToPlayer(identifier).name
      )
    );
  }

  public onPlayerRankChanged(
    identifier: string,
    before: dfg.RankType,
    after: dfg.RankType
  ): void {
    this.roomProxy.broadcast(
      "PlayerRankChangedMessage",
      dfgmsg.encodePlayerRankChangedMessage(
        this.playerMap.clientIDToPlayer(identifier).name,
        before,
        after
      )
    );
  }

  public onInitialInfoProvided(playerCount: number, deckCount: number): void {
    this.roomProxy.broadcast(
      "InitialInfoMessage",
      dfgmsg.encodeInitialInfoMessage(playerCount, deckCount)
    );
  }

  public onCardsProvided(identifier: string, providedCount: number): void {
    this.roomProxy.broadcast(
      "CardsProvidedMessage",
      dfgmsg.encodeCardsProvidedMessage(
        this.playerMap.clientIDToPlayer(identifier).name,
        providedCount
      )
    );
  }
}
