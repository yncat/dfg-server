// clientOptions から、ログインしていいかどうかを boolean で返す。
// 開発中は、 playerName があればいいので、 nameOnlyAdapter で十分。
// セッションを使う場合は、 SessionAdapter を使う用にする。

export interface AuthAdapter {
  authorize: (clientOptions: any) => boolean;
}

export class nameOnlyAdapter implements AuthAdapter {
  public authorize(clientOptions: any): boolean {
    if (!clientOptions.playerName) {
      return false;
    }
    return true;
  }
}

export function createDefaultAuthAdapter(): AuthAdapter {
  return new nameOnlyAdapter();
}
