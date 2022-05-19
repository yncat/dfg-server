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
        "player name is not given",
        WebSocketErrorCode.INVALID_PLAYER_NAME
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const pn: string = clientOptions.playerName as string;
    // Length counts some unicode characters as 2. Apparently Chrome counts in the same way, so intentionally use length.
    if (pn.length > 20) {
      throw new AuthError(
        "player name is too long",
        WebSocketErrorCode.INVALID_PLAYER_NAME
      );
    }
    if (pn.includes("、")) {
      throw new AuthError(
        "player name includes prohibited characters",
        WebSocketErrorCode.INVALID_PLAYER_NAME
      );
    }
    // eslint-disable-next-line no-irregular-whitespace
    if (/^[ 　]+$/.exec(pn)) {
      throw new AuthError(
        "player name contains prohibited pattern",
        WebSocketErrorCode.INVALID_PLAYER_NAME
      );
    }
  }
}

export function createDefaultAuthAdapter(): AuthAdapter {
  return new nameAndVersionAdapter();
}
