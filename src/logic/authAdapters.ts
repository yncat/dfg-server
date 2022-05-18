// clientOptions から、ログインしていいかどうかを返す。ログインしちゃダメなときは、AuthErrorを投げる。
// 開発中は、 playerName があればいいので、 nameOnlyAdapter で十分だった。
// リリースしたので、プロトコルバージョンが違うクライアントからのアクセスをブロックしたくなった。それで、NameAndVersionAdapterになった。
// セッションを使う場合は、 SessionAdapter を使う用にする。等分使わなそうだけど。というか、作ってないけど。

import { protocolVersion } from "../protocolVersion";
import { AuthError, WebSocketErrorCode } from "dfg-messages";

export interface AuthAdapter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  authorize: (clientOptions: any) => void;
}

export class nameAndVersionAdapter implements AuthAdapter {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  public authorize(clientOptions: any): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (clientOptions.protocolVersion !== protocolVersion) {
      throw new AuthError(
        "protocol version mismatch",
        WebSocketErrorCode.PROTOCOL_VERSION_MISMATCH
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!clientOptions.playerName) {
      throw new AuthError(
        "player name is not given or the specified player name is not allowed",
        WebSocketErrorCode.INVALID_PLAYER_NAME
      );
    }
  }
}

export function createDefaultAuthAdapter(): AuthAdapter {
  return new nameAndVersionAdapter();
}
