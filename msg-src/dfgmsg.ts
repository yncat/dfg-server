import {
  Decoder,
  object,
  string,
  optional,
  number,
  boolean,
} from "@mojotech/json-type-validation";

interface ChatRequest {
  message: string;
}

const chatRequestDecoder: Decoder<ChatRequest> = object({
  message: string(),
});

export function decodeChatRequest(encoded: string): ChatRequest {
  return chatRequestDecoder.runWithException(encoded);
}

export function encodeChatRequest(message: string): ChatRequest {
  return {
    message: message,
  };
}

interface ChatMessage {
  playerName: string;
  message: string;
}

const chatMessageDecoder: Decoder<ChatMessage> = object({
  playerName: string(),
  message: string(),
});

export function decodeChatMessage(encoded: string): ChatMessage {
  return chatMessageDecoder.runWithException(encoded);
}

export function encodeChatMessage(
  playerName: string,
  message: string
): ChatMessage {
  return {
    playerName: playerName,
    message: message,
  };
}
