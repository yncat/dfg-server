// clientOptions から、ログインしていいかどうかを boolean で返す。
// 開発中は、 playerName があればいいので、 nameOnlyAdapter で十分。
// セッションを使う場合は、 SessionAdapter を使う用にする。

export interface AuthAdapter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  authorize: (clientOptions: any) => boolean;
}

export class nameOnlyAdapter implements AuthAdapter {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  public authorize(clientOptions: any): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!clientOptions.playerName) {
      return false;
    }
    return true;
  }
}

export function createDefaultAuthAdapter(): AuthAdapter {
  return new nameOnlyAdapter();
}
