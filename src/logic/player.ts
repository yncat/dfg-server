export class Player {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}

export class PlayerConversionError extends Error {}

export function createPlayerFromClientOptions(options: any): Player { // eslint-disable-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  if (!options.playerName) { // eslint-disable-line @typescript-eslint/no-unsafe-member-access
    throw new PlayerConversionError("playerName is required");
  }

  return new Player(options.playerName); // eslint-disable-line @typescript-eslint/no-unsafe-member-access
}
