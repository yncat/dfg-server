import {
  Decoder,
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

export class PayloadDecodeError extends Error {}
export function decodePayload<T>(
  encoded: any,
  decoder: Decoder<T>
): T | PayloadDecodeError {
  const ret = decoder.run(encoded);
  if (ret.ok===false) {
    const e = ret.error;
    return new PayloadDecodeError(
      "Cannot decode Payload."+
      "input: " + e.input + "\n"+
      "at: " + e.at + "\n"+
      "message: " + e.message
    );
  }
  return ret.result;
}
