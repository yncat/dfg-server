import * as dfg from "dfg-simulator";
import * as dfgmsg from "dfg-messages";
import { PlayerMap } from "./playerMap";

export interface EventReceiverCallbacks {
  onGameEnd: () => void;
  onEventLogPush: (eventType: string, eventBody: string) => void;
}

export class EventReceiver implements dfg.EventReceiver {
  playerMap: PlayerMap;
  callbacks: EventReceiverCallbacks;
  constructor(playerMap: PlayerMap, callbacks: EventReceiverCallbacks) {
    this.playerMap = playerMap;
    this.callbacks = callbacks;
  }

  public onNagare(): void {
    this.callbacks.onEventLogPush("NagareMessage", "");
  }

  public onAgari(identifier: string): void {
    this.callbacks.onEventLogPush(
      "AgariMessage",
      JSON.stringify(
        dfgmsg.encodeAgariMessage(
          this.playerMap.clientIDToPlayer(identifier).name
        )
      )
    );
  }

  public onForbiddenAgari(identifier: string): void {
    this.callbacks.onEventLogPush(
      "ForbiddenAgariMessage",
      JSON.stringify(
        dfgmsg.encodeForbiddenAgariMessage(
          this.playerMap.clientIDToPlayer(identifier).name
        )
      )
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onYagiri(identifier: string): void {
    this.callbacks.onEventLogPush("YagiriMessage", "");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onJBack(identifier: string): void {
    this.callbacks.onEventLogPush("JBackMessage", "");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onKakumei(identifier: string): void {
    this.callbacks.onEventLogPush("KakumeiMessage", "");
  }

  public onStrengthInversion(strengthInverted: boolean): void {
    this.callbacks.onEventLogPush(
      "StrengthInversionMessage",
      JSON.stringify(dfgmsg.encodeStrengthInversionMessage(strengthInverted))
    );
  }

  public onDiscard(
    identifier: string,
    discardPair: dfg.CardSelectionPair,
    remainingHandCount: number
  ): void {
    this.callbacks.onEventLogPush(
      "DiscardMessage",
      JSON.stringify(
        dfgmsg.encodeDiscardMessage(
          this.playerMap.clientIDToPlayer(identifier).name,
          dfgmsg.encodeDiscardPairMessage(
            discardPair.cards.map((v) => {
              return dfgmsg.encodeCardMessage(v.mark, v.cardNumber);
            })
          ),
          remainingHandCount
        )
      )
    );
  }

  public onPass(identifier: string, remainingHandCount: number): void {
    this.callbacks.onEventLogPush(
      "PassMessage",
      JSON.stringify(
        dfgmsg.encodePassMessage(
          this.playerMap.clientIDToPlayer(identifier).name,
          remainingHandCount
        )
      )
    );
  }

  public onGameEnd(result: dfg.Result): void {
    const msg = dfgmsg.encodeGameEndMessage(
      result.getIdentifiersByRank(dfg.RankType.DAIFUGO).map((v) => {
        return this.playerMap.clientIDToPlayer(v).name;
      }),
      result.getIdentifiersByRank(dfg.RankType.FUGO).map((v) => {
        return this.playerMap.clientIDToPlayer(v).name;
      }),
      result.getIdentifiersByRank(dfg.RankType.HEIMIN).map((v) => {
        return this.playerMap.clientIDToPlayer(v).name;
      }),
      result.getIdentifiersByRank(dfg.RankType.HINMIN).map((v) => {
        return this.playerMap.clientIDToPlayer(v).name;
      }),
      result.getIdentifiersByRank(dfg.RankType.DAIHINMIN).map((v) => {
        return this.playerMap.clientIDToPlayer(v).name;
      })
    );
    this.callbacks.onEventLogPush("GameEndMessage", JSON.stringify(msg));
    this.callbacks.onGameEnd();
  }

  public onPlayerKicked(identifier: string): void {
    this.callbacks.onEventLogPush(
      "PlayerKickedMessage",
      JSON.stringify(
        dfgmsg.encodePlayerKickedMessage(
          this.playerMap.clientIDToPlayer(identifier).name
        )
      )
    );
  }

  public onPlayerRankChanged(
    identifier: string,
    before: dfg.RankType,
    after: dfg.RankType
  ): void {
    this.callbacks.onEventLogPush(
      "PlayerRankChangedMessage",
      JSON.stringify(
        dfgmsg.encodePlayerRankChangedMessage(
          this.playerMap.clientIDToPlayer(identifier).name,
          before,
          after
        )
      )
    );
  }

  public onInitialInfoProvided(playerCount: number, deckCount: number): void {
    this.callbacks.onEventLogPush(
      "InitialInfoMessage",
      JSON.stringify(dfgmsg.encodeInitialInfoMessage(playerCount, deckCount))
    );
  }

  public onCardsProvided(identifier: string, providedCount: number): void {
    this.callbacks.onEventLogPush(
      "CardsProvidedMessage",
      JSON.stringify(
        dfgmsg.encodeCardsProvidedMessage(
          this.playerMap.clientIDToPlayer(identifier).name,
          providedCount
        )
      )
    );
  }

  public onReverse(): void {
    this.callbacks.onEventLogPush("ReverseMessage", "");
  }

  public onSkip(identifier: string): void {
    this.callbacks.onEventLogPush(
      "TurnSkippedMessage",
      JSON.stringify(
        dfgmsg.encodeTurnSkippedMessage(
          this.playerMap.clientIDToPlayer(identifier).name
        )
      )
    );
  }

  public onTransfer(
    identifier: string,
    targetIdentifier: string,
    transferred: dfg.CardSelectionPair
  ): void {
    this.callbacks.onEventLogPush(
      "TransferMessage",
      JSON.stringify(
        dfgmsg.encodeTransferMessage(
          this.playerMap.clientIDToPlayer(identifier).name,
          this.playerMap.clientIDToPlayer(targetIdentifier).name,
          transferred.cards.map((v) => {
            return dfgmsg.encodeCardMessage(v.mark, v.cardNumber);
          })
        )
      )
    );
  }

  public onExile(identifier: string, exiled: dfg.CardSelectionPair): void {
    this.callbacks.onEventLogPush(
      "ExileMessage",
      JSON.stringify(
        dfgmsg.encodeExileMessage(
          this.playerMap.clientIDToPlayer(identifier).name,
          exiled.cards.map((v) => {
            return dfgmsg.encodeCardMessage(v.mark, v.cardNumber);
          })
        )
      )
    );
  }
}
