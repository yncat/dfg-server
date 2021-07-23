import * as dfgmsg from "../../msg-src/dfgmsg";

export class ChatHandler{
	public generateChatMessage(req:dfgmsg.ChatRequest, playerName:string):dfgmsg.ChatMessage{
		return dfgmsg.encodeChatMessage(playerName,req.message)
	}
}
