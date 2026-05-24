# BLURUM auto-greeter agent

Runs the front door for #general: listens for DMs and auto-adds new wallets to the group, then welcomes them. This is what makes the app's "Request to join" button work one-tap.

```bash
npm i @xmtp/node-sdk viem
export WALLET_KEY=0x...          # the greeter's own wallet
export ENCRYPTION_KEY=0x...      # 32-byte hex for the local XMTP db
export XMTP_ENV=production
export GROUP_ID=                 # empty on first run -> it creates #general & prints the id
node --loader ts-node/esm blurum-greeter.ts
```
Then put the printed GROUP_ID into the app env as `NEXT_PUBLIC_GENERAL_GROUP_ID`
and the greeter's address as `NEXT_PUBLIC_GREETER_ADDRESS`.
