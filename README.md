# online daifugo server

This is online daifugo game server.

## Setup development environment

Clone this repository, run `npm ci` to install dependencies, then run `npm start` to start the server.

In order to play locally, clone [the client side implementation](https://github.com/yncat/dfg) and run it.

## Testing

Running `npm run test` runs tests, including E2E.

## Updating the server state definitions

1. Edit `src/rooms/schema/**.ts`
2. Run `npm run schema:build`
3. Run `npm run schema:copy` to copy the generated schema definitions to the frontend repository, assuming that the dfg repository is cloned at ../dfg
4. Increment the server and frontend protocol versions by one
