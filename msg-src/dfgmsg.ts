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

export interface CardMessage {
  markEnum: number;
  cardNumber: number;
  isChecked: boolean;
  isCheckable: boolean;
}

export const CardMessageDecoder: Decoder<CardMessage> = object({
  markEnum: number(),
  cardNumber: number(),
  isChecked: boolean(),
  isCheckable: boolean(),
});

export function encodeCardMessage(
  markEnum: number,
  cardNumber: number,
  isChecked: boolean,
  isCheckable: boolean
): CardMessage {
  return {
    markEnum: markEnum,
    cardNumber: cardNumber,
    isChecked: isChecked,
    isCheckable: isCheckable,
  };
}

export interface CardListMessage {
  cardList: CardMessage[];
}

export const CardListMessageDecoder: Decoder<CardListMessage> = object({
  cardList: array(CardMessageDecoder),
});

export function encodeCardListMessage(
  cardList: CardMessage[]
): CardListMessage {
  return {
    cardList: cardList
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
