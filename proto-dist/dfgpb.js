/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
(function(global, factory) { /* global define, require, module */

    /* AMD */ if (typeof define === 'function' && define.amd)
        define(["protobufjs/minimal"], factory);

    /* CommonJS */ else if (typeof require === 'function' && typeof module === 'object' && module && module.exports)
        module.exports = factory(require("protobufjs/minimal"));

})(this, function($protobuf) {
    "use strict";

    // Common aliases
    var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;
    
    // Exported root namespace
    var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});
    
    $root.dfgpb = (function() {
    
        /**
         * Namespace dfgpb.
         * @exports dfgpb
         * @namespace
         */
        var dfgpb = {};
    
        dfgpb.ChatRequest = (function() {
    
            /**
             * Properties of a ChatRequest.
             * @memberof dfgpb
             * @interface IChatRequest
             * @property {string|null} [message] ChatRequest message
             */
    
            /**
             * Constructs a new ChatRequest.
             * @memberof dfgpb
             * @classdesc Represents a ChatRequest.
             * @implements IChatRequest
             * @constructor
             * @param {dfgpb.IChatRequest=} [properties] Properties to set
             */
            function ChatRequest(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }
    
            /**
             * ChatRequest message.
             * @member {string} message
             * @memberof dfgpb.ChatRequest
             * @instance
             */
            ChatRequest.prototype.message = "";
    
            /**
             * Creates a new ChatRequest instance using the specified properties.
             * @function create
             * @memberof dfgpb.ChatRequest
             * @static
             * @param {dfgpb.IChatRequest=} [properties] Properties to set
             * @returns {dfgpb.ChatRequest} ChatRequest instance
             */
            ChatRequest.create = function create(properties) {
                return new ChatRequest(properties);
            };
    
            /**
             * Encodes the specified ChatRequest message. Does not implicitly {@link dfgpb.ChatRequest.verify|verify} messages.
             * @function encode
             * @memberof dfgpb.ChatRequest
             * @static
             * @param {dfgpb.IChatRequest} message ChatRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ChatRequest.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.message);
                return writer;
            };
    
            /**
             * Encodes the specified ChatRequest message, length delimited. Does not implicitly {@link dfgpb.ChatRequest.verify|verify} messages.
             * @function encodeDelimited
             * @memberof dfgpb.ChatRequest
             * @static
             * @param {dfgpb.IChatRequest} message ChatRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ChatRequest.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };
    
            /**
             * Decodes a ChatRequest message from the specified reader or buffer.
             * @function decode
             * @memberof dfgpb.ChatRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {dfgpb.ChatRequest} ChatRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ChatRequest.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.dfgpb.ChatRequest();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.message = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };
    
            /**
             * Decodes a ChatRequest message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof dfgpb.ChatRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {dfgpb.ChatRequest} ChatRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ChatRequest.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };
    
            /**
             * Verifies a ChatRequest message.
             * @function verify
             * @memberof dfgpb.ChatRequest
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ChatRequest.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.message != null && message.hasOwnProperty("message"))
                    if (!$util.isString(message.message))
                        return "message: string expected";
                return null;
            };
    
            /**
             * Creates a ChatRequest message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof dfgpb.ChatRequest
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {dfgpb.ChatRequest} ChatRequest
             */
            ChatRequest.fromObject = function fromObject(object) {
                if (object instanceof $root.dfgpb.ChatRequest)
                    return object;
                var message = new $root.dfgpb.ChatRequest();
                if (object.message != null)
                    message.message = String(object.message);
                return message;
            };
    
            /**
             * Creates a plain object from a ChatRequest message. Also converts values to other types if specified.
             * @function toObject
             * @memberof dfgpb.ChatRequest
             * @static
             * @param {dfgpb.ChatRequest} message ChatRequest
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ChatRequest.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults)
                    object.message = "";
                if (message.message != null && message.hasOwnProperty("message"))
                    object.message = message.message;
                return object;
            };
    
            /**
             * Converts this ChatRequest to JSON.
             * @function toJSON
             * @memberof dfgpb.ChatRequest
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ChatRequest.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };
    
            return ChatRequest;
        })();
    
        dfgpb.ChatMessage = (function() {
    
            /**
             * Properties of a ChatMessage.
             * @memberof dfgpb
             * @interface IChatMessage
             * @property {string|null} [playerName] ChatMessage playerName
             * @property {string|null} [message] ChatMessage message
             */
    
            /**
             * Constructs a new ChatMessage.
             * @memberof dfgpb
             * @classdesc Represents a ChatMessage.
             * @implements IChatMessage
             * @constructor
             * @param {dfgpb.IChatMessage=} [properties] Properties to set
             */
            function ChatMessage(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }
    
            /**
             * ChatMessage playerName.
             * @member {string} playerName
             * @memberof dfgpb.ChatMessage
             * @instance
             */
            ChatMessage.prototype.playerName = "";
    
            /**
             * ChatMessage message.
             * @member {string} message
             * @memberof dfgpb.ChatMessage
             * @instance
             */
            ChatMessage.prototype.message = "";
    
            /**
             * Creates a new ChatMessage instance using the specified properties.
             * @function create
             * @memberof dfgpb.ChatMessage
             * @static
             * @param {dfgpb.IChatMessage=} [properties] Properties to set
             * @returns {dfgpb.ChatMessage} ChatMessage instance
             */
            ChatMessage.create = function create(properties) {
                return new ChatMessage(properties);
            };
    
            /**
             * Encodes the specified ChatMessage message. Does not implicitly {@link dfgpb.ChatMessage.verify|verify} messages.
             * @function encode
             * @memberof dfgpb.ChatMessage
             * @static
             * @param {dfgpb.IChatMessage} message ChatMessage message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ChatMessage.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.playerName != null && Object.hasOwnProperty.call(message, "playerName"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.playerName);
                if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.message);
                return writer;
            };
    
            /**
             * Encodes the specified ChatMessage message, length delimited. Does not implicitly {@link dfgpb.ChatMessage.verify|verify} messages.
             * @function encodeDelimited
             * @memberof dfgpb.ChatMessage
             * @static
             * @param {dfgpb.IChatMessage} message ChatMessage message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ChatMessage.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };
    
            /**
             * Decodes a ChatMessage message from the specified reader or buffer.
             * @function decode
             * @memberof dfgpb.ChatMessage
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {dfgpb.ChatMessage} ChatMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ChatMessage.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.dfgpb.ChatMessage();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.playerName = reader.string();
                        break;
                    case 2:
                        message.message = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };
    
            /**
             * Decodes a ChatMessage message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof dfgpb.ChatMessage
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {dfgpb.ChatMessage} ChatMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ChatMessage.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };
    
            /**
             * Verifies a ChatMessage message.
             * @function verify
             * @memberof dfgpb.ChatMessage
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ChatMessage.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.playerName != null && message.hasOwnProperty("playerName"))
                    if (!$util.isString(message.playerName))
                        return "playerName: string expected";
                if (message.message != null && message.hasOwnProperty("message"))
                    if (!$util.isString(message.message))
                        return "message: string expected";
                return null;
            };
    
            /**
             * Creates a ChatMessage message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof dfgpb.ChatMessage
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {dfgpb.ChatMessage} ChatMessage
             */
            ChatMessage.fromObject = function fromObject(object) {
                if (object instanceof $root.dfgpb.ChatMessage)
                    return object;
                var message = new $root.dfgpb.ChatMessage();
                if (object.playerName != null)
                    message.playerName = String(object.playerName);
                if (object.message != null)
                    message.message = String(object.message);
                return message;
            };
    
            /**
             * Creates a plain object from a ChatMessage message. Also converts values to other types if specified.
             * @function toObject
             * @memberof dfgpb.ChatMessage
             * @static
             * @param {dfgpb.ChatMessage} message ChatMessage
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ChatMessage.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.playerName = "";
                    object.message = "";
                }
                if (message.playerName != null && message.hasOwnProperty("playerName"))
                    object.playerName = message.playerName;
                if (message.message != null && message.hasOwnProperty("message"))
                    object.message = message.message;
                return object;
            };
    
            /**
             * Converts this ChatMessage to JSON.
             * @function toJSON
             * @memberof dfgpb.ChatMessage
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ChatMessage.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };
    
            return ChatMessage;
        })();
    
        dfgpb.RoomCreatedMessage = (function() {
    
            /**
             * Properties of a RoomCreatedMessage.
             * @memberof dfgpb
             * @interface IRoomCreatedMessage
             * @property {string|null} [playerName] RoomCreatedMessage playerName
             */
    
            /**
             * Constructs a new RoomCreatedMessage.
             * @memberof dfgpb
             * @classdesc Represents a RoomCreatedMessage.
             * @implements IRoomCreatedMessage
             * @constructor
             * @param {dfgpb.IRoomCreatedMessage=} [properties] Properties to set
             */
            function RoomCreatedMessage(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }
    
            /**
             * RoomCreatedMessage playerName.
             * @member {string} playerName
             * @memberof dfgpb.RoomCreatedMessage
             * @instance
             */
            RoomCreatedMessage.prototype.playerName = "";
    
            /**
             * Creates a new RoomCreatedMessage instance using the specified properties.
             * @function create
             * @memberof dfgpb.RoomCreatedMessage
             * @static
             * @param {dfgpb.IRoomCreatedMessage=} [properties] Properties to set
             * @returns {dfgpb.RoomCreatedMessage} RoomCreatedMessage instance
             */
            RoomCreatedMessage.create = function create(properties) {
                return new RoomCreatedMessage(properties);
            };
    
            /**
             * Encodes the specified RoomCreatedMessage message. Does not implicitly {@link dfgpb.RoomCreatedMessage.verify|verify} messages.
             * @function encode
             * @memberof dfgpb.RoomCreatedMessage
             * @static
             * @param {dfgpb.IRoomCreatedMessage} message RoomCreatedMessage message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            RoomCreatedMessage.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.playerName != null && Object.hasOwnProperty.call(message, "playerName"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.playerName);
                return writer;
            };
    
            /**
             * Encodes the specified RoomCreatedMessage message, length delimited. Does not implicitly {@link dfgpb.RoomCreatedMessage.verify|verify} messages.
             * @function encodeDelimited
             * @memberof dfgpb.RoomCreatedMessage
             * @static
             * @param {dfgpb.IRoomCreatedMessage} message RoomCreatedMessage message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            RoomCreatedMessage.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };
    
            /**
             * Decodes a RoomCreatedMessage message from the specified reader or buffer.
             * @function decode
             * @memberof dfgpb.RoomCreatedMessage
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {dfgpb.RoomCreatedMessage} RoomCreatedMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            RoomCreatedMessage.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.dfgpb.RoomCreatedMessage();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.playerName = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };
    
            /**
             * Decodes a RoomCreatedMessage message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof dfgpb.RoomCreatedMessage
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {dfgpb.RoomCreatedMessage} RoomCreatedMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            RoomCreatedMessage.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };
    
            /**
             * Verifies a RoomCreatedMessage message.
             * @function verify
             * @memberof dfgpb.RoomCreatedMessage
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            RoomCreatedMessage.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.playerName != null && message.hasOwnProperty("playerName"))
                    if (!$util.isString(message.playerName))
                        return "playerName: string expected";
                return null;
            };
    
            /**
             * Creates a RoomCreatedMessage message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof dfgpb.RoomCreatedMessage
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {dfgpb.RoomCreatedMessage} RoomCreatedMessage
             */
            RoomCreatedMessage.fromObject = function fromObject(object) {
                if (object instanceof $root.dfgpb.RoomCreatedMessage)
                    return object;
                var message = new $root.dfgpb.RoomCreatedMessage();
                if (object.playerName != null)
                    message.playerName = String(object.playerName);
                return message;
            };
    
            /**
             * Creates a plain object from a RoomCreatedMessage message. Also converts values to other types if specified.
             * @function toObject
             * @memberof dfgpb.RoomCreatedMessage
             * @static
             * @param {dfgpb.RoomCreatedMessage} message RoomCreatedMessage
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            RoomCreatedMessage.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults)
                    object.playerName = "";
                if (message.playerName != null && message.hasOwnProperty("playerName"))
                    object.playerName = message.playerName;
                return object;
            };
    
            /**
             * Converts this RoomCreatedMessage to JSON.
             * @function toJSON
             * @memberof dfgpb.RoomCreatedMessage
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            RoomCreatedMessage.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };
    
            return RoomCreatedMessage;
        })();
    
        dfgpb.RoomDeletedMessage = (function() {
    
            /**
             * Properties of a RoomDeletedMessage.
             * @memberof dfgpb
             * @interface IRoomDeletedMessage
             * @property {string|null} [playerName] RoomDeletedMessage playerName
             */
    
            /**
             * Constructs a new RoomDeletedMessage.
             * @memberof dfgpb
             * @classdesc Represents a RoomDeletedMessage.
             * @implements IRoomDeletedMessage
             * @constructor
             * @param {dfgpb.IRoomDeletedMessage=} [properties] Properties to set
             */
            function RoomDeletedMessage(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }
    
            /**
             * RoomDeletedMessage playerName.
             * @member {string} playerName
             * @memberof dfgpb.RoomDeletedMessage
             * @instance
             */
            RoomDeletedMessage.prototype.playerName = "";
    
            /**
             * Creates a new RoomDeletedMessage instance using the specified properties.
             * @function create
             * @memberof dfgpb.RoomDeletedMessage
             * @static
             * @param {dfgpb.IRoomDeletedMessage=} [properties] Properties to set
             * @returns {dfgpb.RoomDeletedMessage} RoomDeletedMessage instance
             */
            RoomDeletedMessage.create = function create(properties) {
                return new RoomDeletedMessage(properties);
            };
    
            /**
             * Encodes the specified RoomDeletedMessage message. Does not implicitly {@link dfgpb.RoomDeletedMessage.verify|verify} messages.
             * @function encode
             * @memberof dfgpb.RoomDeletedMessage
             * @static
             * @param {dfgpb.IRoomDeletedMessage} message RoomDeletedMessage message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            RoomDeletedMessage.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.playerName != null && Object.hasOwnProperty.call(message, "playerName"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.playerName);
                return writer;
            };
    
            /**
             * Encodes the specified RoomDeletedMessage message, length delimited. Does not implicitly {@link dfgpb.RoomDeletedMessage.verify|verify} messages.
             * @function encodeDelimited
             * @memberof dfgpb.RoomDeletedMessage
             * @static
             * @param {dfgpb.IRoomDeletedMessage} message RoomDeletedMessage message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            RoomDeletedMessage.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };
    
            /**
             * Decodes a RoomDeletedMessage message from the specified reader or buffer.
             * @function decode
             * @memberof dfgpb.RoomDeletedMessage
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {dfgpb.RoomDeletedMessage} RoomDeletedMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            RoomDeletedMessage.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.dfgpb.RoomDeletedMessage();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.playerName = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };
    
            /**
             * Decodes a RoomDeletedMessage message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof dfgpb.RoomDeletedMessage
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {dfgpb.RoomDeletedMessage} RoomDeletedMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            RoomDeletedMessage.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };
    
            /**
             * Verifies a RoomDeletedMessage message.
             * @function verify
             * @memberof dfgpb.RoomDeletedMessage
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            RoomDeletedMessage.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.playerName != null && message.hasOwnProperty("playerName"))
                    if (!$util.isString(message.playerName))
                        return "playerName: string expected";
                return null;
            };
    
            /**
             * Creates a RoomDeletedMessage message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof dfgpb.RoomDeletedMessage
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {dfgpb.RoomDeletedMessage} RoomDeletedMessage
             */
            RoomDeletedMessage.fromObject = function fromObject(object) {
                if (object instanceof $root.dfgpb.RoomDeletedMessage)
                    return object;
                var message = new $root.dfgpb.RoomDeletedMessage();
                if (object.playerName != null)
                    message.playerName = String(object.playerName);
                return message;
            };
    
            /**
             * Creates a plain object from a RoomDeletedMessage message. Also converts values to other types if specified.
             * @function toObject
             * @memberof dfgpb.RoomDeletedMessage
             * @static
             * @param {dfgpb.RoomDeletedMessage} message RoomDeletedMessage
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            RoomDeletedMessage.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults)
                    object.playerName = "";
                if (message.playerName != null && message.hasOwnProperty("playerName"))
                    object.playerName = message.playerName;
                return object;
            };
    
            /**
             * Converts this RoomDeletedMessage to JSON.
             * @function toJSON
             * @memberof dfgpb.RoomDeletedMessage
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            RoomDeletedMessage.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };
    
            return RoomDeletedMessage;
        })();
    
        return dfgpb;
    })();

    return $root;
});
