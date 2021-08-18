import {
  array,
  boolean,
  constant,
  Decoder,
  number,
  object,
  oneOf,
  string,
} from "@mojotech/json-type-validation";

/*
dfg enum definitions 
*/

/*
カードのマーク(スーと)
*/
export const CardMark = {
  CLUBS: 0,
  DIAMONDS: 1,
  HEARTS: 2,
  SPADES: 3,
  JOKER: 4,
  WILD: 5,
} as const;
export type CardMark = typeof CardMark[keyof typeof CardMark];
export const CardMarkDecoder = oneOf(
  constant(CardMark.CLUBS),
  constant(CardMark.DIAMONDS),
  constant(CardMark.HEARTS),
  constant(CardMark.SPADES),
  constant(CardMark.JOKER),
  constant(CardMark.WILD)
);

/*
プレイヤーのランク
*/

export const RankType = {
  UNDETERMINED: 0,
  DAIHINMIN: 1,
  HINMIN: 2,
  HEIMIN: 3,
  FUGO: 4,
  DAIFUGO: 5,
} as const;
export type RankType = typeof RankType[keyof typeof RankType];
export const RankTypeDecoder = oneOf(
  constant(RankType.UNDETERMINED),
  constant(RankType.DAIHINMIN),
  constant(RankType.HINMIN),
  constant(RankType.HEIMIN),
  constant(RankType.FUGO),
  constant(RankType.DAIFUGO)
);

/*
dfg request / message definitions

# Naming conventions
**Request は、クライアントからサーバーに送信するもの。
**Message は、サーバーからクライアントに送信するもの。
Request がサーバーからクライアントに送られたり、 Message がクライアントからサーバーに送られることはない。

# non-parameter messages
以下のメッセージは、パラメータを持たないので、コードとしては定義していない。
- GameMasterMessage: ゲームマスターの権限をクライアントに与えるとき、そのクライアントに対して送信する。クライアントは、このメッセージを受信したら、ゲーム開始ボタンを表示する。
- GameStartRequest: ゲームマスターのクライアントが、ゲーム開始を要求するときに送信する。
- YourTurnMessage: ゲーム中、ターンが回ってきたクライアントに対して送信する。クライアントは、このメッセージを受信したら、音を出したり、「自分のターンです」というようなガイダンスを出したりする。
- PassRequest: パスをするときにクライアントから送信するリクエスト。
- NagareMessage: 場のカードが流れたときに全員に送信する。
- YagiriMessage: 8切りが発生したときに全員に送信する。
- JBackMessage: 11バックが発生したときに全員に送信する。強さの変化は、別のメッセージで通知される。
- KakumeiMessage: 革命が発生したときに全員に送信する。強さの変化は、別のメッセージで通知される。
- GameEndMessage: ゲームが終了したときに全員に送信する。順位は、別のメッセージで通知される。
/*

/*
ChatRequest: チャット送信要求
クライアントからサーバーへチャットを送る。サーバーは、全員に ChatMessage で返す。
(parameter) message: 送信するメッセージ
*/
export interface ChatRequest {
  message: string;
}

export const ChatRequestDecoder: Decoder<ChatRequest> = object({
  message: string(),
});

export function encodeChatRequest(message: string): ChatRequest {
  return {
    message,
  };
}

/*
ChatMessage: チャット通知
サーバーからのチャット通知。
(parameter) playerName: チャットを送信したプレイヤーの名前
(parameter) message: チャットメッセージ
*/
export interface ChatMessage {
  playerName: string;
  message: string;
}

export const ChatMessageDecoder: Decoder<ChatMessage> = object({
  playerName: string(),
  message: string(),
});

export function encodeChatMessage(
  playerName: string,
  message: string
): ChatMessage {
  return {
    playerName,
    message,
  };
}

/*
PlayerJoinedMessage: プレイヤー入室通知
プレイヤーがルームに入室したときにサーバーから送られてくるメッセージ。すでにゲーム中のルームに誰かが入ってきた場合も送られてくる。
(parameter) playerName: 入室したプレイヤーの名前。
*/
export interface PlayerJoinedMessage {
  playerName: string;
}

export const PlayerJoinedMessageDecoder: Decoder<PlayerJoinedMessage> = object({
  playerName: string(),
});

export function encodePlayerJoinedMessage(
  playerName: string
): PlayerJoinedMessage {
  return {
    playerName,
  };
}

/*
SelectableCardMessage: カード情報+カード選択情報
カードのスーとと番号 + 選択状態、選択可否の情報。出すカードを選ぶチェックボックスを描画するときに使う。メッセージ1つでカード1枚を表す。
(parameter) mark: カードのマークを表す定数
(parameter) cardNumber: カードの番号
(parameter) isChecked: 選択状態かどうか
(parameter) isCheckable:チェックボックスを操作可能にするべきかどうか
*/
export interface SelectableCardMessage {
  mark: CardMark;
  cardNumber: number;
  isChecked: boolean;
  isCheckable: boolean;
}

export const SelectableCardMessageDecoder: Decoder<SelectableCardMessage> =
  object({
    mark: CardMarkDecoder,
    cardNumber: number(),
    isChecked: boolean(),
    isCheckable: boolean(),
  });

export function encodeSelectableCardMessage(
  mark: CardMark,
  cardNumber: number,
  isChecked: boolean,
  isCheckable: boolean
): SelectableCardMessage {
  return {
    mark,
    cardNumber,
    isChecked,
    isCheckable,
  };
}

/*
CardListMessage: カードリストのアップデート通知
カードを選ぶチェックボックスのリストの最新状態を表す。
(parameter) cardList: カードリスト。 SelectableCardMessage の配列。
*/
export interface CardListMessage {
  cardList: SelectableCardMessage[];
}

export const CardListMessageDecoder: Decoder<CardListMessage> = object({
  cardList: array(SelectableCardMessageDecoder),
});

export function encodeCardListMessage(
  cardList: SelectableCardMessage[]
): CardListMessage {
  return {
    cardList,
  };
}

/*
TurnMessage: ターン開始通知
ターンの始まりを表す。
(parameter) playerName: 次に行動するプレイヤーの名前
*/
export interface TurnMessage {
  playerName: string;
}

export const TurnMessageDecoder: Decoder<TurnMessage> = object({
  playerName: string(),
});

export function encodeTurnMessage(playerName: string): TurnMessage {
  return {
    playerName,
  };
}

/*
CardSelectRequest: カード選択リクエスト
アクティブプレイヤーが特定のカードをカードリストから選択するときに、クライアントが送信するリクエスト。
(parameter) index: 選択するカードの 0-start インデックス番号
*/
export interface CardSelectRequest {
  index: number;
}

export const CardSelectRequestDecoder: Decoder<CardSelectRequest> = object({
  index: number(),
});

export function encodeCardSelectRequest(index: number): CardSelectRequest {
  return {
    index,
  };
}

/*
DiscardRequest: カードプレイリクエスト
アクティブプレイヤーがカードをプレイするリクエスト。
(parameter) index: 選択するプレイ可能なペアの 0-start インデックス番号。DiscardPairListMessageで通知された最新の情報に基づく。
*/
export interface DiscardRequest {
  index: number;
}

export const DiscardRequestDecoder: Decoder<DiscardRequest> = object({
  index: number(),
});

export function encodeDiscardRequest(index: number): DiscardRequest {
  return {
    index,
  };
}

/*
CardMessage: 選択に関する情報がない単純なカードメッセージ
スーとと数字の情報のみ。出すカードのペアを列挙するときに利用する。
(parameter) mark: カードのスーとを表す定数
(parameter) cardNumber: カード番号
*/
export interface CardMessage {
  mark: CardMark;
  cardNumber: number;
}

export const CardMessageDecoder: Decoder<CardMessage> = object({
  mark: CardMarkDecoder,
  cardNumber: number(),
});

export function encodeCardMessage(
  mark: CardMark,
  cardNumber: number
): CardMessage {
  return {
    mark,
    cardNumber,
  };
}

/*
DiscardPairMessage: 出すカードのペア
1セットの有効なプレイカードのペアを表す。
(parameter) cardList: ペアとなるカード。 CardMessage の配列。
*/
export interface DiscardPairMessage {
  cardList: CardMessage[];
}

export const DiscardPairMessageDecoder: Decoder<DiscardPairMessage> = object({
  cardList: array(CardMessageDecoder),
});

export function encodeDiscardPairMessage(
  cardList: CardMessage[]
): DiscardPairMessage {
  return {
    cardList,
  };
}

/*
DiscardPairListMessage: プレイ可能なペア一覧メッセージ
プレイ可能なカードのペアを列挙した結果を表す。クライアントは、このメッセージを受け取ったら、それぞれをボタンとして描画して、それらがプレイできるようにインターフェイスを提供する。
(parameter) DiscardPairList: 有効なペアの一覧。 DiscardPairMessage の配列。
*/
export interface DiscardPairListMessage {
  discardPairList: DiscardPairMessage[];
}

export const DiscardPairListMessageDecoder: Decoder<DiscardPairListMessage> =
  object({
    discardPairList: array(DiscardPairMessageDecoder),
  });

export function encodeDiscardPairListMessage(
  discardPairList: DiscardPairMessage[]
): DiscardPairListMessage {
  return {
    discardPairList,
  };
}

/*
AgariMessage: あがりメッセージ
プレイヤーが上がったときのメッセージ。順位の情報は、別のメッセージで送られてくる。
(parameter) playerName: あがったプレイヤーの名前。
*/
export interface AgariMessage {
  playerName: string;
}

export const AgariMessageDecoder: Decoder<AgariMessage> = object({
  playerName: string(),
});

export function encodeAgariMessage(playerName: string): AgariMessage {
  return {
    playerName,
  };
}

/*
ForbiddenAgariMessage: 禁止あがりメッセージ
プレイヤーが禁じ手で上がったときのメッセージ。順位の情報は、別のメッセージで送られてくる。
(parameter) playerName: 禁じ手であがったプレイヤーの名前。
*/
export interface ForbiddenAgariMessage {
  playerName: string;
}

export const ForbiddenAgariMessageDecoder: Decoder<ForbiddenAgariMessage> =
  object({
    playerName: string(),
  });

export function encodeForbiddenAgariMessage(
  playerName: string
): ForbiddenAgariMessage {
  return {
    playerName,
  };
}

/*
StrengthInversionMessage: 強さ変化メッセージ
カードの強さが変化したときのメッセージ。
(parameter) isStrengthInverted: true のとき、3が一番強い。 false のとき、2が一番強い。
*/
export interface StrengthInversionMessage {
  isStrengthInverted: boolean;
}

export const StrengthInversionMessageDecoder: Decoder<StrengthInversionMessage> =
  object({
    isStrengthInverted: boolean(),
  });

export function encodeStrengthInversionMessage(
  isStrengthInverted: boolean
): StrengthInversionMessage {
  return {
    isStrengthInverted,
  };
}

/*
DiscardMessage: カードプレイメッセージ。
カードをプレイして場に出したときのメッセージ。
(parameter) playerName: カードをプレイしたプレイヤーの名前。
(parameter) discardPair: プレイしたカード。 DiscardPairMessage を参照。
(parameter) remainingHandCount: 出した後、手札に残るカードの枚数。
*/
export interface DiscardMessage {
  playerName: string;
  discardPair: DiscardPairMessage;
  remainingHandCount: number;
}

export const DiscardMessageDecoder: Decoder<DiscardMessage> = object({
  playerName: string(),
  discardPair: DiscardPairMessageDecoder,
  remainingHandCount: number(),
});

export function encodeDiscardMessage(
  playerName: string,
  discardPair: DiscardPairMessage,
  remainingHandCount: number
): DiscardMessage {
  return {
    playerName,
    discardPair,
    remainingHandCount,
  };
}

/*
PassMessage: パスメッセージ
プレイヤーがパスしたときのメッセージ。
(parameter) playerName: パスしたプレイヤーの名前。
*/
export interface PassMessage {
  playerName: string;
}

export const PassMessageDecoder: Decoder<PassMessage> = object({
  playerName: string(),
});

export function encodePassMessage(playerName: string): PassMessage {
  return {
    playerName,
  };
}

/*
PlayerKickedMessage: プレイヤーキックメッセージ
プレイヤーが接続落ちなどでキックされた時のメッセージ。
(parameter) playerName: キックされたプレイヤーの名前。
*/
export interface PlayerKickedMessage {
  playerName: string;
}

export const PlayerKickedMessageDecoder: Decoder<PlayerKickedMessage> = object({
  playerName: string(),
});

export function encodePlayerKickedMessage(
  playerName: string
): PlayerKickedMessage {
  return {
    playerName,
  };
}

/*
PlayerRankChangedMessage: ランク変更メッセージ
プレイヤーのランクが変化したとき(上がってランクが付いたときも含む)送信されるメッセージ。
(parameter) playerName: ランクが変化したプレイヤーの名前。
(parameter) before: 変更前のランク。変更前にランクが付いていなかったときは RankType.UNDETERMINED という値 (実際には 0) が入る。
(parameter) after: 変更後のランク。 RankType.xx の値。
*/
export interface PlayerRankChangedMessage {
  playerName: string;
  before: RankType;
  after: RankType;
}

export const PlayerRankChangedMessageDecoder: Decoder<PlayerRankChangedMessage> =
  object({
    playerName: string(),
    before: RankTypeDecoder,
    after: RankTypeDecoder,
  });

export function encodePlayerRankChangedMessage(
  playerName: string,
  before: RankType,
  after: RankType
): PlayerRankChangedMessage {
  return {
    playerName,
    before,
    after,
  };
}

/*
InitialInfoMessage: ゲーム開始情報メッセージ
ゲーム開始時、初期情報を伝達するメッセージ。
(parameter) playerCount: ゲームに参加するプレイヤーの数。
(parameter) deckCount: 使用するデッキの数。
*/
export interface InitialInfoMessage {
  playerCount: number;
  deckCount: number;
}

export const InitialInfoMessageDecoder: Decoder<InitialInfoMessage> = object({
  playerCount: number(),
  deckCount: number(),
});

export function encodeInitialInfoMessage(
  playerCount: number,
  deckCount: number
): InitialInfoMessage {
  return {
    playerCount,
    deckCount,
  };
}

/*
CardsProvidedMessage: カード配布メッセージ
特定のプレイヤーにカードが配られたときの通知メッセージ。
(parameter) playerName: カードが配られたプレイヤーの名前。
(parameter) cardCount: 配られたカードの枚数。
*/
export interface CardsProvidedMessage {
  playerName: string;
  cardCount: number;
}

export const CardsProvidedMessageDecoder: Decoder<CardsProvidedMessage> =
  object({
    playerName: string(),
    cardCount: number(),
  });

export function encodeCardsProvidedMessage(
  playerName: string,
  cardCount: number
): CardsProvidedMessage {
  return {
    playerName,
    cardCount,
  };
}

/*
GameEndMessage: ゲーム終了メッセージ
ゲーム終了&結果通知メッセージ
(parameter) daifugoNameList: 大富豪となったプレイヤー名のリスト。リストではあるが、今のところ一人だけ。
(parameter) fugoNameList: 富豪となったプレイヤー名のリスト。
(parameter) heiminNameList: 平民となったプレイヤー名のリスト。
(parameter) hinminNameList: 貧民となったプレイヤー名のリスト。
(parameter) daihinminNameList: 大貧民となったプレイヤー名のリスト。リストではあるが、今のところ一人。
*/
export interface GameEndMessage {
  daifugoNameList: string[];
  fugoNameList: string[];
  heiminNameList: string[];
  hinminNameList: string[];
  daihinminNameList: string[];
}

export const GameEndMessageDecoder: Decoder<GameEndMessage> = object({
  daifugoNameList: array(string()),
  fugoNameList: array(string()),
  heiminNameList: array(string()),
  hinminNameList: array(string()),
  daihinminNameList: array(string()),
});

export function encodeGameEndMessage(
  daifugoNameList: string[],
  fugoNameList: string[],
  heiminNameList: string[],
  hinminNameList: string[],
  daihinminNameList: string[]
): GameEndMessage {
  return {
    daifugoNameList,
    fugoNameList,
    heiminNameList,
    hinminNameList,
    daihinminNameList,
  };
}

export class PayloadDecodeError extends Error {}
export function decodePayload<T>(
  encoded: any, // eslint-disable-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  decoder: Decoder<T>
): T | PayloadDecodeError {
  const ret = decoder.run(encoded);
  if (ret.ok === false) {
    const e = ret.error;
    return new PayloadDecodeError(
      "Cannot decode Payload." +
        "input: " +
        e.input +
        "\n" +
        "at: " +
        e.at +
        "\n" +
        "message: " +
        e.message
    );
  }
  return ret.result;
}
