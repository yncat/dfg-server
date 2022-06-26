export class Player {
  name: string;
  private connected: boolean;
  constructor(name: string) {
    this.name = name;
    this.connected = true;
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public markAsDisconnected(): void {
    this.connected = false;
  }

  public markAsConnected(): void {
    this.connected = true;
  }
}

export class PlayerConversionError extends Error {}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export function createPlayerFromClientOptions(options: any): Player {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (!options.playerName) {
    throw new PlayerConversionError("playerName is required");
  }

  return new Player(options.playerName); // eslint-disable-line @typescript-eslint/no-unsafe-member-access
}
