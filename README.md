# online daifugo server

## Environment variables

- DFG_OTP_SECRET: TOTP secret key for admin authorization. Can be generated using npm run otp-secret-generate. Currently unused.

## npm scripts

- start: starts the server.
- test: runs unit test and E2E.
- lint: Run linter.
- fmt: fix format.
- fmt-lint: check format, but do not fix.
