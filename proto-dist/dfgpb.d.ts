import * as $protobuf from "protobufjs";
/** Namespace dfgpb. */
export namespace dfgpb {

    /** Properties of a ChatRequest. */
    interface IChatRequest {

        /** ChatRequest message */
        message?: (string|null);
    }

    /** Represents a ChatRequest. */
    class ChatRequest implements IChatRequest {

        /**
         * Constructs a new ChatRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: dfgpb.IChatRequest);

        /** ChatRequest message. */
        public message: string;

        /**
         * Creates a new ChatRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ChatRequest instance
         */
        public static create(properties?: dfgpb.IChatRequest): dfgpb.ChatRequest;

        /**
         * Encodes the specified ChatRequest message. Does not implicitly {@link dfgpb.ChatRequest.verify|verify} messages.
         * @param message ChatRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: dfgpb.IChatRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ChatRequest message, length delimited. Does not implicitly {@link dfgpb.ChatRequest.verify|verify} messages.
         * @param message ChatRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: dfgpb.IChatRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ChatRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ChatRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): dfgpb.ChatRequest;

        /**
         * Decodes a ChatRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ChatRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): dfgpb.ChatRequest;

        /**
         * Verifies a ChatRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ChatRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ChatRequest
         */
        public static fromObject(object: { [k: string]: any }): dfgpb.ChatRequest;

        /**
         * Creates a plain object from a ChatRequest message. Also converts values to other types if specified.
         * @param message ChatRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: dfgpb.ChatRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ChatRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a ChatMessage. */
    interface IChatMessage {

        /** ChatMessage playerName */
        playerName?: (string|null);

        /** ChatMessage message */
        message?: (string|null);
    }

    /** Represents a ChatMessage. */
    class ChatMessage implements IChatMessage {

        /**
         * Constructs a new ChatMessage.
         * @param [properties] Properties to set
         */
        constructor(properties?: dfgpb.IChatMessage);

        /** ChatMessage playerName. */
        public playerName: string;

        /** ChatMessage message. */
        public message: string;

        /**
         * Creates a new ChatMessage instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ChatMessage instance
         */
        public static create(properties?: dfgpb.IChatMessage): dfgpb.ChatMessage;

        /**
         * Encodes the specified ChatMessage message. Does not implicitly {@link dfgpb.ChatMessage.verify|verify} messages.
         * @param message ChatMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: dfgpb.IChatMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ChatMessage message, length delimited. Does not implicitly {@link dfgpb.ChatMessage.verify|verify} messages.
         * @param message ChatMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: dfgpb.IChatMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ChatMessage message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ChatMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): dfgpb.ChatMessage;

        /**
         * Decodes a ChatMessage message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ChatMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): dfgpb.ChatMessage;

        /**
         * Verifies a ChatMessage message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ChatMessage message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ChatMessage
         */
        public static fromObject(object: { [k: string]: any }): dfgpb.ChatMessage;

        /**
         * Creates a plain object from a ChatMessage message. Also converts values to other types if specified.
         * @param message ChatMessage
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: dfgpb.ChatMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ChatMessage to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a RoomCreatedMessage. */
    interface IRoomCreatedMessage {

        /** RoomCreatedMessage playerName */
        playerName?: (string|null);
    }

    /** Represents a RoomCreatedMessage. */
    class RoomCreatedMessage implements IRoomCreatedMessage {

        /**
         * Constructs a new RoomCreatedMessage.
         * @param [properties] Properties to set
         */
        constructor(properties?: dfgpb.IRoomCreatedMessage);

        /** RoomCreatedMessage playerName. */
        public playerName: string;

        /**
         * Creates a new RoomCreatedMessage instance using the specified properties.
         * @param [properties] Properties to set
         * @returns RoomCreatedMessage instance
         */
        public static create(properties?: dfgpb.IRoomCreatedMessage): dfgpb.RoomCreatedMessage;

        /**
         * Encodes the specified RoomCreatedMessage message. Does not implicitly {@link dfgpb.RoomCreatedMessage.verify|verify} messages.
         * @param message RoomCreatedMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: dfgpb.IRoomCreatedMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified RoomCreatedMessage message, length delimited. Does not implicitly {@link dfgpb.RoomCreatedMessage.verify|verify} messages.
         * @param message RoomCreatedMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: dfgpb.IRoomCreatedMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a RoomCreatedMessage message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns RoomCreatedMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): dfgpb.RoomCreatedMessage;

        /**
         * Decodes a RoomCreatedMessage message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns RoomCreatedMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): dfgpb.RoomCreatedMessage;

        /**
         * Verifies a RoomCreatedMessage message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a RoomCreatedMessage message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns RoomCreatedMessage
         */
        public static fromObject(object: { [k: string]: any }): dfgpb.RoomCreatedMessage;

        /**
         * Creates a plain object from a RoomCreatedMessage message. Also converts values to other types if specified.
         * @param message RoomCreatedMessage
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: dfgpb.RoomCreatedMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this RoomCreatedMessage to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a RoomDeletedMessage. */
    interface IRoomDeletedMessage {

        /** RoomDeletedMessage playerName */
        playerName?: (string|null);
    }

    /** Represents a RoomDeletedMessage. */
    class RoomDeletedMessage implements IRoomDeletedMessage {

        /**
         * Constructs a new RoomDeletedMessage.
         * @param [properties] Properties to set
         */
        constructor(properties?: dfgpb.IRoomDeletedMessage);

        /** RoomDeletedMessage playerName. */
        public playerName: string;

        /**
         * Creates a new RoomDeletedMessage instance using the specified properties.
         * @param [properties] Properties to set
         * @returns RoomDeletedMessage instance
         */
        public static create(properties?: dfgpb.IRoomDeletedMessage): dfgpb.RoomDeletedMessage;

        /**
         * Encodes the specified RoomDeletedMessage message. Does not implicitly {@link dfgpb.RoomDeletedMessage.verify|verify} messages.
         * @param message RoomDeletedMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: dfgpb.IRoomDeletedMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified RoomDeletedMessage message, length delimited. Does not implicitly {@link dfgpb.RoomDeletedMessage.verify|verify} messages.
         * @param message RoomDeletedMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: dfgpb.IRoomDeletedMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a RoomDeletedMessage message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns RoomDeletedMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): dfgpb.RoomDeletedMessage;

        /**
         * Decodes a RoomDeletedMessage message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns RoomDeletedMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): dfgpb.RoomDeletedMessage;

        /**
         * Verifies a RoomDeletedMessage message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a RoomDeletedMessage message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns RoomDeletedMessage
         */
        public static fromObject(object: { [k: string]: any }): dfgpb.RoomDeletedMessage;

        /**
         * Creates a plain object from a RoomDeletedMessage message. Also converts values to other types if specified.
         * @param message RoomDeletedMessage
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: dfgpb.RoomDeletedMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this RoomDeletedMessage to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }
}
