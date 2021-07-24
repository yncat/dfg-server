import { PayloadDecodeError } from "../../msg-src/dfgmsg";

export function isDecodeSuccess<T>(decoded: T | PayloadDecodeError): decoded is T {
  return !(decoded instanceof PayloadDecodeError);
}
