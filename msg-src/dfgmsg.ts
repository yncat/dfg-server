import {
  array,
  boolean,
  Decoder,
  number,
  object,
  string,
} from "@mojotech/json-type-validation";

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
