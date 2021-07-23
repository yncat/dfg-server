import { PayloadDecodeError } from "../../msg-src/dfgmsg";

export function isDecodeSuccess<T>(decoded:T|PayloadDecodeError):boolean{
	return !(decoded instanceof PayloadDecodeError)
}