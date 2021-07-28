export class Player {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}

export class PlayerConversionError extends Error {}

export function createPlayerFromClientOptions(options: any): Player {
  if (!options.playerName) {
    throw new PlayerConversionError("playerName is required");
  }

  return new Player(options.playerName);
}
