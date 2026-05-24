# BLURUM — Next.js production build

The real, bundled version where **XMTP live chat works** (the WASM engine is bundled, not loaded from a CDN), with RainbowKit multi-wallet, gamification, share card + Farcaster Mini App.

## Run locally
```bash
cd blurum-app
cp .env.local.example .env.local   # fill in NEXT_PUBLIC_WC_PROJECT_ID at minimum
npm install
npm run dev                        # http://localhost:3000
```
Get a free WalletConnect projectId at https://cloud.reown.com.

## What's included
- **Wallets:** RainbowKit `getDefaultConfig` → MetaMask, Rabby (EIP-6963), Coinbase Smart Wallet, WalletConnect (QR/mobile), all on Base.
- **Live chat:** `lib/useXmtp.ts` creates a real XMTP client from your wallet, creates/joins the `#general` MLS group, streams messages, and sends. History persists on the XMTP network and resumes automatically.
- **Agents:** add any wallet/inbox to `#general` (your own AI agent or a friend).
- **Gamification:** `lib/game.ts` — XP, levels, daily streak check-in, quests/missions, combo meter, confetti, all persisted per wallet.
- **Leaderboard** ranked by XP. **Share card** → `composeCast` (Mini App) or Warpcast intent + PNG download.
- **Farcaster Mini App:** embed meta in `app/layout.tsx`; `next.config.js` 307-redirects `/.well-known/farcaster.json` to your hosted manifest. `sdk.actions.ready()` + FC profile pull happen client-side.
- **Theme:** `app/globals.css` is the BLURUM lounge theme (ported 1:1 from the prototype).

## Deploy (Vercel recommended)
```bash
npm i -g vercel
vercel        # preview
vercel --prod
```
Then add the domain **blurum.xyz** in the Vercel dashboard and set DNS. The manifest redirect in `next.config.js` is already wired to your Farcaster hosted manifest. Put `icon.png`, `splash.png`, `image.png` (already in `public/`) live at the domain root.

## First run flow
1. Connect Wallet → "Start chat" (signs once to create your XMTP identity).
2. Founder taps **Create #general**, then set `NEXT_PUBLIC_GENERAL_GROUP_ID` to that group id so everyone lands in the same room.
3. Others connect → they’re added via the Agents tab (or run the auto-greeter agent for one-tap join).

## Notes / tweaks you may need
- Package versions are recent-stable; if `npm install` flags a peer/version mismatch, bump to the latest of that package.
- Coinbase **Smart Wallet** is a smart-contract account — if you sign in with it and XMTP rejects the EOA signer, switch the signer `type` to `"SCW"` and add `getChainId: () => 8453` in `lib/useXmtp.ts` (EOA wallets like MetaMask/Rabby work as-is).
- `$BLURUM` tipping is UI-only until you set `NEXT_PUBLIC_BLURUM_TOKEN` and wire the TipJar contract.

## Auto-deploy (GitHub Actions -> Vercel)
`.github/workflows/deploy.yml` deploys on every push to `main`. Add three repo secrets
(Settings -> Secrets and variables -> Actions):
- `VERCEL_TOKEN`     — from vercel.com/account/tokens
- `VERCEL_ORG_ID`    — from `.vercel/project.json` after running `vercel link` locally
- `VERCEL_PROJECT_ID`— same file
App env vars (`NEXT_PUBLIC_*`) are set in the Vercel project settings, not here.
