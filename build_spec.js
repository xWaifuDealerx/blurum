const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType, ShadingType,
  TableOfContents, PageNumber, Header, Footer, PageBreak, ExternalHyperlink,
} = require("docx");

const BLUE = "1652F0";
const DARK = "0A1F44";
const GREY = "555555";
const CODEBG = "F3F4F6";

const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] });
const P = (t, opts = {}) =>
  new Paragraph({ spacing: { after: 140, line: 276 }, children: [new TextRun({ text: t, ...opts })] });
const runs = (arr) => new Paragraph({ spacing: { after: 140, line: 276 }, children: arr });
const B = (t) => new TextRun({ text: t, bold: true });
const T = (t) => new TextRun({ text: t });

function bullet(t, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { after: 60, line: 264 },
    children: typeof t === "string" ? [new TextRun(t)] : t,
  });
}

function code(src) {
  const lines = src.replace(/\t/g, "    ").split("\n");
  const paras = lines.map(
    (ln) =>
      new Paragraph({
        spacing: { after: 0, line: 240 },
        children: [new TextRun({ text: ln.length ? ln : " ", font: "Consolas", size: 16, color: "1A1A1A" })],
      })
  );
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 9360, type: WidthType.DXA },
            shading: { fill: CODEBG, type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 160, right: 160 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "E0E0E0" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "E0E0E0" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "E0E0E0" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "E0E0E0" },
            },
            children: paras,
          }),
        ],
      }),
    ],
  });
}

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
function table(headers, rows, widths) {
  const total = widths.reduce((a, b) => a + b, 0);
  const headRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (h, i) =>
        new TableCell({
          width: { size: widths[i], type: WidthType.DXA },
          borders,
          shading: { fill: BLUE, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF" })] })],
        })
    ),
  });
  const bodyRows = rows.map(
    (r, ri) =>
      new TableRow({
        children: r.map(
          (c, i) =>
            new TableCell({
              width: { size: widths[i], type: WidthType.DXA },
              borders,
              shading: { fill: ri % 2 ? "F6F8FC" : "FFFFFF", type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: c.split("\n").map((line) => new Paragraph({ children: [new TextRun({ text: line, size: 19 })] })),
            })
        ),
      })
  );
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths, rows: [headRow, ...bodyRows] });
}

const children = [];

children.push(new Paragraph({ spacing: { before: 1800, after: 0 }, alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "BlueRoom", bold: true, size: 88, color: BLUE })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 },
  children: [new TextRun({ text: "The living social lounge where humans + AI agents hang out, tip, and make plans onchain.", italics: true, size: 26, color: DARK })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
  children: [new TextRun({ text: "Production Architecture & Build Plan — Base Mainnet, 2026", size: 22, color: GREY })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
  children: [new TextRun({ text: "Stack: XMTP (MLS) · Coinbase AgentKit · Bankr/Clanker · MiniKit + OnchainKit · Next.js 15", size: 18, color: GREY })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "Prepared for Kristoffer · May 2026", size: 18, color: GREY })] }));
children.push(new Paragraph({ children: [new PageBreak()] }));

children.push(H1("Contents"));
children.push(new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-2" }));
children.push(new Paragraph({ children: [new PageBreak()] }));

children.push(H1("0. Your decisions, baked in"));
children.push(P("This plan is tailored to four choices you made up front, so it is opinionated rather than generic:"));
children.push(table(
  ["Decision", "Your choice", "What it changes in this build"],
  [
    ["Token launch", "Launch on Bankr later", "Contracts are token-AGNOSTIC. We deploy app contracts now against a mock token, then wire in the real $BLUEROOM address (from Bankr/Clanker) with one setToken() call and lock it."],
    ["Primary users", "Agent builders / AI-pilled", "Agents are first-class citizens, not bots bolted on. Agent wallets, agent tipping, agent-proposed plans, and optional agent tokenization (Virtuals) are headline features."],
    ["Flagship MVP", "Tipping + reactions first", "Phase 1 ships emoji-react-to-tip + reputation. Group plans/escrow is the contract that's ready but switched on in Phase 2."],
    ["Deliverable", "Both", "You get this document plus runnable code files (contracts, agent, frontend hook, deploy script)."],
  ],
  [1900, 2300, 5160]
));

children.push(H1("1. Token launch plan ($BLUEROOM via Bankr)"));
children.push(P("Because the coin does not exist yet and you want to launch on Bankr, the smartest sequencing is to decouple the product from the token. Build and ship the app on a testnet/mock token, get real usage, and only then fair-launch $BLUEROOM. Bankr (the @bankrbot agent) deploys tokens through the Clanker protocol: a single transaction creates an ERC-20 with a Uniswap V4 liquidity pool, and the launcher earns the majority share of swap fees forever. That makes it ideal for a SocialFi token where you want viral, Farcaster-native distribution rather than a VC-style raise."));
children.push(H2("How a Bankr/Clanker launch actually works"));
children.push(bullet("You trigger the launch by tagging @bankrbot on X or Farcaster (or via the Bankr app), specifying name, ticker, and optional parameters. Clanker handles deployment."));
children.push(bullet("Clanker mints the ERC-20 and pairs it into a Uniswap V4 pool in one transaction — no manual LP seeding required."));
children.push(bullet("There is a ~1.2% fee on swaps; the creator's share (the majority) streams to your wallet in real time. A small slice funds the Bankr ecosystem. There are no lockups."));
children.push(bullet("Clanker supports vesting schedules, airdrops, dev-buys, and customizable fee/reward splits — use these for your treasury and airdrop allocations."));
children.push(H2("Recommended distribution for a social + agent economy"));
children.push(P("You want the token to circulate as in-app currency, not just be a speculative chip. A distribution that supports that:"));
children.push(table(
  ["Bucket", "Suggested %", "Purpose"],
  [
    ["Fair-launch / public pool", "55-65%", "Open liquidity on the Clanker pool. Anyone can buy; price discovery is on the curve."],
    ["Community + agent rewards", "15-20%", "Drip into the TipJar reward pool, agent starter grants, leaderboard prizes, quests."],
    ["Treasury (multisig)", "10-15%", "Vested. Funds development, audits, liquidity backstops, partnerships."],
    ["Airdrop to early users", "5-10%", "Reward Phase-1 testnet users + active Farcaster accounts to bootstrap the social graph."],
  ],
  [2600, 1500, 5260]
));
children.push(runs([B("Key principle: "), T("the app must work before the token has value. Tips on testnet teach the behaviour; the mainnet token then plugs into a habit that already exists. Keep founder/team allocation modest and transparent — agent-builder communities are allergic to stealthy insider bags.")]));
children.push(H2("On naming"));
children.push(P("“BlueRoom” is clean and on-brand for Base (blue). If you want something punchier for the token while keeping BlueRoom as the product, options worth checking for ENS/Farcaster availability: $LOUNGE, $HANGOUT, $BLUE, $ROOM, $ROOMIES. My recommendation: keep the product BlueRoom and ticker $BLUEROOM (or short $ROOM) for coherence — one strong name beats two weak ones."));

children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(H1("2. High-level architecture"));
children.push(P("Four planes: a chat plane (XMTP), an agent plane (AgentKit + LangGraph), an onchain plane (your contracts + the Bankr token on Base), and a client plane (a MiniKit/OnchainKit mini app that runs inside the Base App and Farcaster, plus a standalone web dapp). An indexer ties events back into the UI for leaderboards and plan state."));
children.push(H2("Mermaid diagram"));
children.push(code(
`flowchart TD
    subgraph Client["Client plane (Next.js 15)"]
      MA["MiniKit + OnchainKit mini app\n(Base App / Farcaster)"]
      WEB["Standalone web dapp\n(mobile-friendly)"]
      SW["Coinbase Smart Wallet\n+ Paymaster (gasless)"]
    end
    subgraph Chat["Chat plane"]
      XMTP["XMTP network (MLS)\nE2E-encrypted group rooms"]
    end
    subgraph Agents["Agent plane (Node backend)"]
      ASDK["@xmtp/agent-sdk\nevent listeners"]
      AK["Coinbase AgentKit\nSmart Wallet + actions"]
      LG["LangGraph brain\n(decide: chat / tip / plan)"]
      VP["(optional) Virtuals\nagent tokenization"]
    end
    subgraph Chain["Onchain plane (Base mainnet)"]
      TOKEN["$BLUEROOM ERC-20\n(launched via Bankr/Clanker)"]
      TIP["BlueRoomTipJar\nemoji-react-to-tip + reputation"]
      ESC["BlueRoomPlanEscrow\ngroup plans / shared spend"]
    end
    IDX["Indexer / API\n(Ponder or envio)\nleaderboards, plan state"]
    MA <--> XMTP
    WEB <--> XMTP
    MA --> SW
    SW -->|tip / contribute / vote| TIP
    SW --> ESC
    SW -->|approve / swap| TOKEN
    XMTP <--> ASDK
    ASDK --> LG
    LG --> AK
    AK -->|tip / createPlan / approve| TIP
    AK --> ESC
    AK -->|hold + transfer| TOKEN
    VP -. tokenize .- AK
    TIP -->|events| IDX
    ESC -->|events| IDX
    IDX --> MA
    IDX --> WEB
    IDX --> LG`
));
children.push(P("Paste that block into mermaid.live or any Mermaid renderer to see the picture. Two things make BlueRoom unusual: (1) the agent plane and the human client plane hit the SAME contracts through the SAME wallet abstraction, so an agent is economically indistinguishable from a human; and (2) everything is gasless via the Smart Wallet + Paymaster, so tipping feels like tapping a 'like'."));

children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(H1("3. Smart contracts"));
children.push(P("Three Solidity files are provided as runnable code alongside this document: BlueRoomTipJar.sol, BlueRoomPlanEscrow.sol, and MockBlueRoom.sol (testnet only). All use OpenZeppelin and follow secure patterns: SafeERC20, ReentrancyGuard on every mutating entrypoint, Pausable kill-switch, AccessControl roles (no god-owner), checks-effects-interactions ordering, and pull-over-push refunds. Solidity 0.8.24 (overflow-checked by default)."));
children.push(H2("3a. BlueRoomTipJar — the flagship (Phase 1)"));
children.push(bullet("Token-agnostic: token address is unset at deploy. After the Bankr launch you call setToken(address, lockForever=true) once, permanently freezing it."));
children.push(bullet("Custodial-free: funds move directly from tipper to recipient — the contract never holds balances, killing a whole class of drain risk."));
children.push(bullet("Emoji-react-to-tip: tip() takes an emoji label and an optional messageId, so the UI's react gesture maps to a preset amount and the reaction is recorded onchain via events."));
children.push(bullet("Gasless: tip() is a single transfer designed to be Paymaster-sponsored. tipWithPermit() bundles an EIP-2612 signature so there's no separate approve transaction."));
children.push(bullet("Indexer-first reputation: minimal counters live onchain; the rich Tip event drives leaderboards. A bounded (<=5%) optional protocol fee routes to treasury, defaulting to 0."));
children.push(P("Core logic (full file provided separately):"));
children.push(code(
`function tip(address to, uint256 amount, bytes32 roomId,
             string calldata emoji, bytes32 messageId)
    external whenNotPaused nonReentrant
{
    _tip(msg.sender, to, amount, roomId, emoji, messageId);
}

function _tip(address from, address to, uint256 amount, bytes32 roomId,
              string calldata emoji, bytes32 messageId) internal {
    if (address(token) == address(0)) revert TokenNotSet();
    if (to == address(0)) revert ZeroAddress();
    if (to == from)       revert SelfTip();      // no reputation farming
    if (amount == 0)      revert ZeroAmount();

    uint256 fee = (feeBps == 0) ? 0 : (amount * feeBps) / 10_000;
    uint256 net = amount - fee;
    if (fee > 0) token.safeTransferFrom(from, feeRecipient, fee);
    token.safeTransferFrom(from, to, net);       // direct, non-custodial

    tipsSentTotal[from]   += amount;
    tipsReceivedTotal[to] += net;
    unchecked { tipCountReceived[to] += 1; }
    emit Tip(from, to, roomId, net, fee, emoji, messageId);
}`
));
children.push(H2("3b. BlueRoomPlanEscrow — making plans together (Phase 2)"));
children.push(P("One contract holds many plans (registry pattern — far cheaper than a contract per plan). A room pools $BLUEROOM toward a goal (trip, meetup, content collab, meme drop, group buy). Release is contribution-weighted: your vote weight equals what you put in, and funds release to a payout address once approval weight crosses a configurable threshold (e.g. 60%). Agents that contributed vote exactly like humans, making them true co-signers. If the deadline passes without release, or the creator cancels, contributors pull-refund their share."));
children.push(code(
`createPlan(roomId, payoutTo, goal, deadline, approvalThresholdBps, title) -> planId
contribute(planId, amount)   // escrow tokens; measures actual received (fee-on-transfer safe)
approveRelease(planId)       // contribution-weighted yes-vote
release(planId)              // pays payoutTo once approvalWeight >= threshold of raised
cancel(planId)               // creator only, before deadline
refund(planId)               // pull refund if cancelled or deadline passed unreleased`
));
children.push(H2("3c. Optional: reputation & governance"));
children.push(P("For Phase 3, a non-transferable reputation (soulbound) score can be derived purely from TipJar events by the indexer — no extra contract needed at first. If you later want on-chain governance over a shared treasury, add a minimal Governor or reuse the PlanEscrow voting pattern scoped to the treasury. Keep agents and humans on the same reputation rails."));

children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(H1("4. AgentKit + XMTP integration"));
children.push(P("The agent uses three libraries: @xmtp/agent-sdk for event-driven MLS group chat, Coinbase AgentKit for a gasless Smart Wallet and onchain actions on Base, and LangGraph as the brain that decides whether to chat, tip, or make a plan. The agent derives BOTH its XMTP identity and its money wallet from one key, so it has a single address for talking and tipping — just like a human. AgentKit's CDP Smart Wallet + Paymaster lets it transact on Base mainnet without holding ETH."));
children.push(P("The flagship behaviour (tip) and plan proposal are wired as custom AgentKit actions the LLM can choose to call:"));
children.push(code(
`customActionProvider({
  name: "blueroom_tip",
  description: "Tip a member in $BLUEROOM. Use to reward genuinely great messages.",
  schema: z.object({ to: z.string(), amount: z.number().positive(),
                     roomId: z.string(), emoji: z.string().default("fire") }),
  invoke: async (wallet, args) => {
    const amount = parseUnits(String(args.amount), TOKEN_DECIMALS);
    await wallet.sendTransaction({ to: BLUEROOM_TOKEN, data: approve(TIPJAR, amount) });
    const hash = await wallet.sendTransaction({
      to: TIPJAR,
      data: encodeFunctionData({ abi: TIPJAR_ABI, functionName: "tip",
        args: [args.to, amount, keccak256(stringToHex(args.roomId)), args.emoji, ZERO] }),
    });
    return "Tipped " + args.amount + " $BLUEROOM. tx: " + hash;
  },
}),`
));
children.push(P("The XMTP side listens for events and lets the brain respond. Humans simply add the agent's address to a group like any other member:"));
children.push(code(
`const agent = await Agent.createFromEnv({ env: "production" });   // mainnet XMTP
agent.on("group", (ctx) => ctx.conversation.sync());              // auto-join rooms
agent.on("text", async (ctx) => {
  if (ctx.message.senderInboxId === agent.inboxId) return;        // ignore self
  const result = await brain.invoke(
    { messages: [{ role: "user", content: ctx.message.content }] },
    { configurable: { thread_id: ctx.conversation.id } });        // per-room memory
  await ctx.sendText(result.messages.at(-1).content);
});
await agent.start();`
));
children.push(runs([B("Optional — Virtuals Protocol: "), T("if you want users to launch their own tokenized agents (each agent gets a token and co-owned treasury), Virtuals is the established path. Treat it as opt-in: most agents run on a plain AgentKit wallet; only “star” agents the community wants to invest in get tokenized. Low barrier to spin up an agent, while still enabling the breakout-agent economy that excites builders.")]));

children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(H1("5. Frontend structure"));
children.push(P("Build it as a Base Mini App with MiniKit + OnchainKit so a single Next.js 15 codebase runs natively inside the Base App and Farcaster (launching straight from a cast) AND as a standalone mobile-friendly web dapp. MiniKit auto-configures wagmi + react-query and picks the Farcaster connector inside a frame, falling back to Coinbase Smart Wallet elsewhere. Scaffold with npx create-onchain --mini."));
children.push(H2("Key components"));
children.push(table(
  ["Component", "Responsibility"],
  [
    ["<RoomList />", "Rooms the user is in (XMTP conversations), unread counts, who's online incl. agents."],
    ["<ChatRoom />", "The live MLS group thread: messages, presence, agent messages rendered inline."],
    ["<TipReactionBar />", "Long-press/hover a message to react. Each emoji maps to a preset $BLUEROOM amount and fires a gasless tip()."],
    ["<TipToast />", "Confirms a tip, animates emoji + amount, updates the recipient's running total."],
    ["<PlanCard />", "Renders a plan: goal, raised, deadline, contributors, vote progress; Contribute / Approve buttons."],
    ["<Leaderboard />", "Top tippers, top earners, top agents — from the indexer (Tip events)."],
    ["<WalletPill />", "OnchainKit identity + $BLUEROOM balance; buy on the Clanker pool via embedded swap."],
  ],
  [3000, 6360]
));
children.push(H2("The tip UX (the magic moment)"));
children.push(P("Reacting to a message IS tipping. The hook keeps it to a single sponsored transaction so it feels like a like, not a payment:"));
children.push(code(
`export const TIP_PRESETS = { thumbsup:1, fire:5, rocket:10, hundred:25, crown:100 };
const { tip } = useBlueRoomTip();
// user taps fire on a message ->
await tip({ to: authorAddress, emoji: "fire", roomId, messageId });
// one gasless tx via Smart Wallet + Paymaster; TipToast animates; leaderboard updates`
));
children.push(P("Onboarding is make-or-break: a first-time user signs in with a Coinbase Smart Wallet (passkey, no seed phrase), drops into a public lobby room with a friendly agent, and gets a tiny $BLUEROOM faucet/airdrop so their very first action can be tipping someone. Crypto stays invisible; the social loop is immediate."));

children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(H1("6. Deployment & testing roadmap"));
children.push(table(
  ["Phase", "Goal", "Key steps"],
  [
    ["P0 — Local", "Contracts correct", "Foundry unit + fuzz tests for TipJar/PlanEscrow (reentrancy, self-tip, threshold math, refund paths). Full branch coverage on money paths."],
    ["P1 — Base Sepolia", "Full loop on testnet", "Deploy contracts + MockBlueRoom. Run the agent against testnet XMTP. Exercise react-to-tip, permit tips, plan create/contribute/approve/release/refund. Use the CDP faucet for gas."],
    ["P2 — Audit & token", "Security + $BLUEROOM live", "Independent audit (or at least Slither + reputable review) before mainnet. Launch $BLUEROOM via Bankr. Verify the Clanker pool."],
    ["P3 — Mainnet", "Wire & ship", "Deploy contracts to mainnet, call setToken(BLUEROOM, lockForever=true) on both, configure the Paymaster policy, publish the mini app to Base App + Farcaster."],
    ["P4 — Grow", "Scale & iterate", "Enable protocol fee if warranted, turn on plans, airdrop to P1 users, monitor with alerts on Pause/role events."],
  ],
  [1700, 2300, 5360]
));
children.push(H2("Security checklist (do not skip)"));
children.push(bullet("Run Slither + solc warnings clean; write Foundry fuzz/invariant tests for escrow accounting (raised == sum of contributions; can't release below threshold; can't double-refund)."));
children.push(bullet("Admin keys on a multisig (Safe). Consider a timelock on setFee. Lock the token address after launch (lockForever=true)."));
children.push(bullet("Treat fee-on-transfer / rebasing tokens defensively (escrow measures actual received). Confirm the Clanker token is a standard ERC-20 before locking."));
children.push(bullet("Rate-limit agent spending: per-room and per-day tip caps in the agent's own logic, plus a dead-man Pause role for incident response."));
children.push(bullet("Paymaster policy: allowlist only your contract methods so sponsored gas can't be drained by arbitrary calls."));

children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(H1("7. Virality & monetization"));
children.push(H2("Why it spreads on Base / Farcaster"));
children.push(bullet("Mini app = shareable cast. A BlueRoom invite is a Farcaster frame; tapping it drops you straight into a room. Big tips and funded plans auto-compose a cast."));
children.push(bullet("Agents are content. An entertaining, generous agent is a reason to join a room and to screenshot it. Builders spin up novel agents to show off — each is organic marketing."));
children.push(bullet("Tipping is a flex and a gift. Public leaderboards (top earner, most generous, top agent) create status competition; receiving a tip pulls people back."));
children.push(bullet("Plans create commitment. People who pool money into a trip/collab evangelize it; escrow turns a group chat into a daily-return reason."));
children.push(H2("Monetization levers"));
children.push(table(
  ["Lever", "How"],
  [
    ["Clanker swap fees", "As $BLUEROOM launcher you earn the majority of the ~1.2% swap fee forever — revenue tied to the trading volume your app creates."],
    ["Optional protocol tip fee", "TipJar has a bounded (<=5%, default 0) fee to treasury. Turn it on modestly once volume is healthy."],
    ["Plan fee", "A small bps fee on successful plan releases (Phase-2 toggle) funds the treasury when real coordination happens."],
    ["Premium agents / rooms", "Charge $BLUEROOM for premium agent capabilities, private rooms, custom personalities, or boosted leaderboard placement."],
    ["Agent launch cut", "If you integrate Virtuals-style tokenized agents, take a cut of agent token launches done through BlueRoom."],
  ],
  [2600, 6760]
));

children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(H1("8. Challenges & solutions"));
children.push(table(
  ["Challenge", "Solution"],
  [
    ["Gas friction kills tipping", "Coinbase Smart Wallet + CDP Paymaster sponsor every tip/contribute. Tipping feels like a like; users never see ETH. Batch tips for agents."],
    ["Agent autonomy / runaway spend", "Per-room and per-day spend caps in agent code; the agent holds only a working float, not the treasury; human Pause role; allowlisted Paymaster methods."],
    ["Spam / sybil tipping for reputation", "No self-tips (enforced onchain); reputation is the indexer's weighted view (de-dupe sybils, weight by distinct counterparties and value, decay over time)."],
    ["Token has no value at launch", "Decouple: ship behaviour on testnet/mock first; airdrop to proven users; the habit precedes the price."],
    ["XMTP / SDK churn", "APIs move fast in 2026 (XMTP mainnet ~Mar 2026; AgentKit quarterly updates). Pin versions, isolate SDK calls behind a thin adapter, track release notes."],
    ["Bad agents / harmful content", "Agents are addresses: mute/ban at room level, reputation slashing via indexer, allowlist agents that can transact above a threshold."],
    ["Custody & key safety", "Non-custodial contracts (no pooled user funds in TipJar). Admin on a Safe multisig + timelock. Agent keys in a KMS, rotated."],
    ["Mainnet incident", "Pausable on both contracts; alerts on role changes, pause, and large transfers; documented runbook."],
  ],
  [3000, 6360]
));

children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(H1("Appendix — provided code files & references"));
children.push(P("Runnable files delivered with this spec:"));
children.push(bullet("contracts/BlueRoomTipJar.sol — emoji-react-to-tip + reputation (Phase 1 flagship)."));
children.push(bullet("contracts/BlueRoomPlanEscrow.sol — group plans / shared spend escrow (Phase 2)."));
children.push(bullet("contracts/MockBlueRoom.sol — testnet-only $BLUEROOM stand-in with EIP-2612 permit."));
children.push(bullet("agent/blueroom-agent.ts — XMTP Agent SDK + AgentKit + LangGraph agent."));
children.push(bullet("agent/useBlueRoomTip.ts — Next.js/wagmi react-to-tip hook."));
children.push(bullet("agent/Deploy.s.sol — Foundry deploy script (token wired in post-launch)."));
children.push(H2("References (verified May 2026)"));
const refs = [
  ["XMTP — Build agents", "https://docs.xmtp.org/agents/get-started/intro"],
  ["XMTP — Group chat (MLS)", "https://docs.xmtp.org/groups/build-group-chat"],
  ["@xmtp/agent-sdk (npm)", "https://www.npmjs.com/package/@xmtp/agent-sdk"],
  ["Coinbase AgentKit", "https://docs.cdp.coinbase.com/agent-kit/welcome"],
  ["AgentKit + XMTP example", "https://github.com/coinbase/agentkit/blob/main/typescript/examples/langchain-xmtp-chatbot/README.md"],
  ["Bankr", "https://bankr.bot/"],
  ["Clanker", "https://www.clanker.world/"],
  ["Base MiniKit", "https://docs.base.org/builderkits/minikit/overview"],
];
refs.forEach((r) =>
  children.push(new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 },
    children: [new ExternalHyperlink({ children: [new TextRun({ text: r[0] + " — " + r[1], style: "Hyperlink" })], link: r[1] })] }))
);

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22, color: "222222" } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 34, bold: true, color: BLUE, font: "Arial" },
        paragraph: { spacing: { before: 320, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 27, bold: true, color: DARK, font: "Arial" },
        paragraph: { spacing: { before: 240, after: 140 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 23, bold: true, color: DARK, font: "Arial" },
        paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 540, hanging: 280 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1080, hanging: 280 } } } },
      ] },
      { reference: "nums", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 540, hanging: 280 } } } },
      ] },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "BlueRoom — Build Plan", color: GREY, size: 16 })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Page ", color: GREY, size: 16 }), new TextRun({ children: [PageNumber.CURRENT], color: GREY, size: 16 })] })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("/sessions/charming-keen-meitner/mnt/outputs/BlueRoom_Build_Plan.docx", buf);
  console.log("wrote BlueRoom_Build_Plan.docx", buf.length, "bytes");
});
