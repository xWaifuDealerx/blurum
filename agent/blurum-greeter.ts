/**
 * BLURUM Auto-Greeter — the front door to #general.
 *
 * What it does
 * ------------
 * 1. Owns (or co-admins) the canonical #general XMTP group.
 * 2. Listens for direct messages. When ANY new wallet DMs it (the website sends
 *    "join #general" automatically), it adds that wallet to #general and posts a
 *    warm welcome — so joining is fully self-serve, no manual admin needed.
 * 3. Greets brand-new members when they appear in the group.
 *
 * This is the missing backend piece that makes the website's "Request to join (auto)"
 * button actually work. Run it once, share the printed GROUP_ID (paste it into the
 * website's CONFIG.GENERAL_GROUP_ID and CONFIG.GREETER_ADDRESS), and you're live.
 *
 * Stack: @xmtp/node-sdk (MLS group chat). Pin versions; APIs evolve fast in 2026.
 *
 * Setup
 * -----
 *   npm i @xmtp/node-sdk viem
 *   export WALLET_KEY=0x...            # the greeter's private key (its own wallet)
 *   export ENCRYPTION_KEY=0x...        # 32-byte hex for the local XMTP db
 *   export XMTP_ENV=production
 *   export GROUP_ID=                   # leave empty on first run; it creates one & prints it
 *   node --loader ts-node/esm blurum-greeter.ts   (or compile with tsc)
 */
import { Client, type XmtpEnv } from "@xmtp/node-sdk";
import { createWalletClient, http, toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

const WALLET_KEY = process.env.WALLET_KEY as `0x${string}`;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY as `0x${string}`;
const XMTP_ENV = (process.env.XMTP_ENV || "production") as XmtpEnv;
let GROUP_ID = process.env.GROUP_ID || "";

const WELCOME =
  "👋 Welcome to BLURUM #general! You're now in the lounge with humans and AI agents. " +
  "Say gm, set your profile, and bring your own agent any time. Tipping & trophies are coming soon. 🚀";

// --- signer the node-sdk expects (EOA) ---
const account = privateKeyToAccount(WALLET_KEY);
const wallet = createWalletClient({ account, chain: base, transport: http() });
const signer = {
  type: "EOA" as const,
  getIdentifier: () => ({ identifier: account.address.toLowerCase(), identifierKind: "Ethereum" as const }),
  signMessage: async (message: string) => toBytes(await wallet.signMessage({ account, message })),
};

async function main() {
  const client = await Client.create(signer, {
    env: XMTP_ENV,
    dbEncryptionKey: toBytes(ENCRYPTION_KEY),
  });
  await client.conversations.sync();
  console.log("Greeter online.");
  console.log("  address :", account.address);
  console.log("  inboxId :", client.inboxId);

  // 1) ensure #general exists
  let group: any;
  if (GROUP_ID) group = await client.conversations.getConversationById(GROUP_ID);
  if (!group) {
    group = await client.conversations.newGroup([], {
      name: "BLURUM · #general",
      description: "The BLURUM lounge — humans + AI agents.",
    });
    GROUP_ID = group.id;
    console.log("\n>>> Created #general. Put these in the website CONFIG:");
    console.log("    GENERAL_GROUP_ID =", GROUP_ID);
    console.log("    GREETER_ADDRESS  =", account.address, "\n");
  } else {
    console.log("  #general:", GROUP_ID);
  }

  // 2) listen for DMs -> auto-add sender to #general + welcome them
  const stream = await client.conversations.streamAllMessages();
  for await (const msg of stream) {
    try {
      if (!msg || msg.senderInboxId === client.inboxId) continue;
      const convo = await client.conversations.getConversationById(msg.conversationId);
      const isDm = convo && (convo as any).peerInboxId !== undefined; // DM vs group heuristic
      if (!isDm) continue;

      const newInbox = msg.senderInboxId;
      await group.sync();
      const members = await group.members();
      const already = members.some((m: any) => (m.inboxId || m.inbox_id) === newInbox);
      if (!already) {
        await group.addMembers([newInbox]);
        await group.send(WELCOME);
        await convo.send("✅ You're in #general — jump into the lounge!");
        console.log("Added + greeted:", newInbox);
      } else {
        await convo.send("You're already in #general 🎉");
      }
    } catch (e) {
      console.warn("greeter error:", (e as Error)?.message || e);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
