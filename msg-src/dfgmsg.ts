import {
  array,
  boolean,
  Decoder,
  number,
  object,
  string,
} from "@mojotech/json-type-validation";

/*
dfg message definitions

# Naming conventions
**Request は、クライアントからサーバーに送信するもの。
**Message は、サーバーからクライアントに送信するもの。
Request がサーバーからクライアントに送られたり、 Message がクライアントからサーバーに送られることはない。

# non-parameter messages
以下のメッセージは、パラメータを持たないので、コードとしては定義していない。
- GameMasterMessage: ゲームマスターの権限をクライアントに与えるとき、そのクライアントに対して送信する。クライアントは、このメッセージを受信したら、ゲーム開始ボタンを表示する。
- YourTurnMessage: ゲーム中、ターンが回ってきたクライアントに対して送信する。クライアントは、このメッセージを受信したら、音を出したり、「自分のターンです」というようなガイダンスを出したりする。
- NagareMessage: 場のカードが流れたときに全員に送信する。
- YagiriMessage: 8切りが発生したときに全員に送信する。
- JBackMessage: 11バックが発生したときに全員に送信する。強さの変化は、別のメッセージで通知される。
- KakumeiMessage: 革命が発生したときに全員に送信する。強さの変化は、別のメッセージで通知される。
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
    message: message,
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
    playerName: playerName,
    message: message,
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
    playerName: playerName,
  };
}

/*
SelectableCardMessage: カード情報+カード選択情報
カードのスーとと番号 + 選択状態、選択可否の情報。出すカードを選ぶチェックボックスを描画するときに使う。メッセージ1つでカード1枚を表す。
(parameter) cardMark: カードのマークを表す定数
(parameter) cardNumber: カードの番号
(parameter) isChecked: 選択状態かどうか
(parameter) isCheckable:チェックボックスを操作可能にするべきかどうか
*/
export interface SelectableCardMessage {
  markEnum: number;
  cardNumber: number;
  isChecked: boolean;
  isCheckable: boolean;
}

export const SelectableCardMessageDecoder: Decoder<SelectableCardMessage> =
  object({
    markEnum: number(),
    cardNumber: number(),
    isChecked: boolean(),
    isCheckable: boolean(),
  });

export function encodeSelectableCardMessage(
  markEnum: number,
  cardNumber: number,
  isChecked: boolean,
  isCheckable: boolean
): SelectableCardMessage {
  return {
    markEnum: markEnum,
    cardNumber: cardNumber,
    isChecked: isChecked,
    isCheckable: isCheckable,
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
    cardList: cardList,
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
    playerName: playerName,
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
    index: index,
  };
}

/*
CardMessage: 選択に関する情報がない単純なカードメッセージ
スーとと数字の情報のみ。出すカードのペアを列挙するときに利用する。
(parameter) markEnum: カードのスーとを表す定数
(parameter) cardNumber: カード番号
*/
export interface CardMessage {
  markEnum: number;
  cardNumber: number;
}

export const CardMessageDecoder: Decoder<CardMessage> = object({
  markEnum: number(),
  cardNumber: number(),
});

export function encodeCardMessage(
  markEnum: number,
  cardNumber: number
): CardMessage {
  return {
    markEnum: markEnum,
    cardNumber: cardNumber,
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
    cardList: cardList,
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
    discardPairList: discardPairList,
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
    playerName: playerName,
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
    playerName: playerName,
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
    isStrengthInverted: isStrengthInverted,
  };
}

export class PayloadDecodeError extends Error {}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function decodePayload<T>(
  encoded: any,
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
