"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { useConnectModal, useAccountModal } from "@rainbow-me/rainbowkit";
import { createClient } from "@supabase/supabase-js";
import Chat from "@/components/Chat";
import { useGame, levelInfo, DAILY, ONBOARD } from "@/lib/game";
import { resolveName } from "@/lib/names";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://blurum.xyz";
const BLURUM_TOKEN = process.env.NEXT_PUBLIC_BLURUM_TOKEN || "";
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const sb = SB_URL && SB_KEY ? createClient(SB_URL, SB_KEY) : null;
const REQUIRE_COIN = process.env.NEXT_PUBLIC_REQUIRE_COIN === "1";
const short = (a?: string) => (a ? a.slice(0, 6) + "…" + a.slice(-4) : "");
const avHTML = (emoji: string, img?: string) => (img ? <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} /> : <>{emoji}</>);

export default function Page() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const [toasts, setToasts] = useState<any[]>([]);
  const toast = useCallback((html: string, emoji?: string) => { const id = Math.random(); setToasts((t) => [...t, { id, html, emoji }]); setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2700); }, []);
  const g = useGame(address, toast);
  const [view, setView] = useState("general");
  const [navOpen, setNavOpen] = useState(false);
  const [profile, setProfile] = useState<any>({ emoji: "🧑‍🚀", name: "", handle: "", bio: "", avatar: "" });
  const [basename, setBasename] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => { if (typeof window === "undefined") return; const k = "blurum:profile:" + (address || "guest"); try { const p = JSON.parse(localStorage.getItem(k) || "null"); setProfile(p ? { emoji: "🧑‍🚀", name: "", handle: "", bio: "", avatar: "", ...p } : { emoji: "🧑‍🚀", name: "", handle: "", bio: "", avatar: "" }); } catch {} }, [address]);
  const saveProfile = (p: any) => { setProfile(p); try { localStorage.setItem("blurum:profile:" + (address || "guest"), JSON.stringify(p)); } catch {} g.awardOnce("profile", 15); };

  useEffect(() => {
    if (isConnected && address) {
      g.awardOnce("connect", 10);
      resolveName(address).then((r) => { if (r.name) { setBasename(r.name); setProfile((p: any) => ({ ...p, name: p.name || r.name, avatar: p.avatar || r.avatar || "" })); } }).catch(() => {});
    }
  }, [isConnected, address]);

  // You only land on the leaderboard once you've said gm (streak > 0). Synced to Supabase.
  useEffect(() => {
    if (!sb || !isConnected || !address || !(g.game.streak > 0)) return;
    const id = setTimeout(() => {
      sb!.from("members").upsert({ address: address.toLowerCase(), name: profile.name || profile.handle || null, emoji: profile.emoji || "🧑‍🚀", xp: g.game.xp, streak: g.game.streak, updated_at: new Date().toISOString() }, { onConflict: "address" }).then(() => {}, () => {});
    }, 600);
    return () => clearTimeout(id);
  }, [isConnected, address, g.game.xp, g.game.streak, profile.name, profile.handle, profile.emoji]);

  const meName = () => profile.name || profile.handle || "you";
  const meEmoji = () => profile.emoji || "🧑‍🚀";
  const li = levelInfo(g.game.xp);
  const founder = useFounder(address);
  const locked = REQUIRE_COIN && !(isConnected && founder.launched);

  const NAV = [
    { id: "general", ic: "💬", label: "General" }, { id: "agents", ic: "🤖", label: "Agents" }, { id: "launch", ic: "🚀", label: "Launchpad" },
    { id: "quests", ic: "🎯", label: "Quests" }, { id: "board", ic: "📊", label: "Leaderboard" },
    { id: "trophies", ic: "🏆", label: "Trophies", soon: true }, { id: "profile", ic: "👤", label: "Profile" },
  ];

  return (
    <div className={"app" + (navOpen ? " nav-open" : "")}>
      <div className="backdrop" onClick={() => setNavOpen(false)} />
      <aside className="col sidebar">
        <div className="brand"><img src="/logo.png" alt="BLURUM" onError={(e) => { const t = e.currentTarget as HTMLImageElement; if (!t.src.endsWith("/icon.png")) t.src = "/icon.png"; }} style={{ width: 38, height: 38, borderRadius: 12, objectFit: "cover", boxShadow: "var(--glow)" }} /><div><h1>BLURUM</h1><div className="tag">Lounge · Base</div></div></div>
        <nav className="nav">
          {NAV.map((n) => (
            <div key={n.id} className={"navi" + (view === n.id ? " active" : "")} onClick={() => { setView(n.id); setNavOpen(false); }}>
              <span className="ic">{n.ic}</span> {n.label}
              {n.soon ? <span className="soon">Soon</span> : n.id === "quests" && isConnected ? <span className="ct">{DAILY.filter((m) => !g.game.q.done[m.id]).length}</span> : null}
            </div>
          ))}
        </nav>
        <div className="wallet">
          {isConnected ? (
            <>
              <div className="who"><div className="pfp">{avHTML(meEmoji(), profile.avatar)}</div><div><div className="nm">{meName()}</div><div className="ad">{basename || short(address)}</div></div></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--mut)", marginBottom: 4 }}><span>Lv {li.lvl} · {li.title}</span><span>{li.next ? `${li.into}/${li.span} XP` : `${li.xp} XP`}</span></div>
              <div className="xpbar"><i style={{ width: li.pct + "%" }} /></div>
              <div style={{ display: "flex", gap: 8, marginTop: 11 }}>
                <button className={"chip" + (g.checkedInToday ? "" : " cta")} style={{ flex: 1, justifyContent: "center" }} onClick={g.checkIn}>{g.checkedInToday ? `🔥 ${g.game.streak} day${g.game.streak === 1 ? "" : "s"}` : "gm · check in"}</button>
                <button className="btn ghost sm" onClick={openAccountModal}>•••</button>
              </div>
            </>
          ) : (
            <><div className="bal">— <span>$BLURUM</span></div><div className="sub">connect to start</div><button className="btn primary full" style={{ marginTop: 11 }} onClick={openConnectModal}>Connect Wallet</button></>
          )}
        </div>
      </aside>

      <main className="col main">
        <button className="menu-btn" style={{ position: "absolute", margin: 12, zIndex: 5 }} onClick={() => setNavOpen(true)}>☰</button>

        {view === "general" && <ComingSoonChat />}

        {view === "agents" && <AgentsView isConnected={isConnected} openConnectModal={openConnectModal} />}

        {view === "launch" && <LaunchpadView address={address} isConnected={isConnected} openConnectModal={openConnectModal} profile={profile} toast={toast} canComment={!REQUIRE_COIN || founder.launched} onFounderRefresh={founder.refresh} />}

        {view === "quests" && locked && <LockGate what="Quests" isConnected={isConnected} openConnectModal={openConnectModal} goLaunch={() => setView("launch")} />}

        {view === "quests" && !locked && (
          <section className="view active"><div className="vhead"><div className="vemoji">🎯</div><div><h2>Quests</h2><p>complete tasks, earn XP</p></div></div>
            <div className="scroll"><div className="wrap">
              {!isConnected ? <div className="card" style={{ textAlign: "center", padding: 34 }}><p style={{ color: "var(--mut)" }}>Connect to earn XP from quests.</p><button className="btn primary" onClick={openConnectModal}>Connect Wallet</button></div> : <>
                <div className="banner" style={{ margin: "0 0 16px" }}>🎯 Earn XP by completing quests. Daily missions reset every day.</div>
                <div className="section-title" style={{ margin: "0 0 10px" }}>Getting started</div>
                <div className="card">{ONBOARD.map((q) => { const d = !!g.game.once[q.flag]; return <div key={q.flag} className="qrow"><div className={"qic" + (d ? " done" : "")}>{d ? "✓" : q.icon}</div><div style={{ flex: 1 }}><div className="qn">{q.name}</div></div>{d && <span className="qx">done</span>}</div>; })}</div>
                <div className="section-title">Daily missions</div>
                <div className="card">{DAILY.map((m) => { const p = Math.min((g.game.q as any)[m.field] || 0, m.target); const done = !!g.game.q.done[m.id]; return <div key={m.id} className="qrow"><div className={"qic" + (done ? " done" : "")}>{done ? "✓" : m.icon}</div><div style={{ flex: 1 }}><div className="qn">{m.name}</div><div className="xpbar" style={{ marginTop: 6 }}><i style={{ width: Math.round((p / m.target) * 100) + "%" }} /></div></div><span className="qx">{done ? "✓ " : ""}+{m.xp} XP</span></div>; })}</div>
              </>}
            </div></div></section>
        )}

        {view === "board" && <BoardView isConnected={isConnected} setSharing={setSharing} me={{ name: meName(), emoji: meEmoji(), avatar: profile.avatar, xp: isConnected ? g.game.xp : 0, streak: g.game.streak, coins: founder.count, address }} />}

        {view === "trophies" && (
          <section className="view active"><div className="vhead"><div className="vemoji">🏆</div><div><h2>Trophies</h2><p>community NFT awards</p></div></div>
            <div className="soonwrap"><div><div className="big">🏆</div><h3>Trophies are coming soon</h3><p>Collectible NFT awards for $BLURUM holders and active members will land here after the token launch.</p></div></div></section>
        )}

        {view === "profile" && (
          <section className="view active"><div className="vhead"><div className="vemoji">👤</div><div><h2>My Profile</h2><p>your BLURUM identity</p></div><div className="right">{isConnected && <><button className="btn primary sm" onClick={() => setSharing(true)}>Share</button><button className="btn ghost sm" onClick={() => setEditing(true)}>Edit</button></>}</div></div>
            <div className="scroll"><div className="wrap">
              {!isConnected ? <div className="card" style={{ textAlign: "center", padding: 40 }}><div style={{ fontSize: 40 }}>👤</div><p style={{ color: "var(--mut)", margin: "12px 0 16px" }}>Connect your wallet to create your BLURUM profile.</p><button className="btn primary" onClick={openConnectModal}>Connect Wallet</button></div> : <>
                <div className="pcover" /><div className="pcard">
                  <div className="pfp-lg">{avHTML(meEmoji(), profile.avatar)}</div>
                  <div><div className="pname">{meName()} {founder.launched && <span className="mtag agent">👑 Founder</span>}</div>{basename ? <div className="bname">🔵 {basename}</div> : profile.handle ? <div className="phandle">@{profile.handle}</div> : null}</div>
                  <div className="paddr">🔗 {short(address)}</div>
                  {profile.bio ? <p className="pbio">{profile.bio}</p> : <p className="pbio" style={{ color: "var(--mut2)" }}>No bio yet — hit “Edit”.</p>}
                  <div className="lvlcard"><div className="lhead"><div className="lvlbig">{li.lvl}</div><div style={{ flex: 1 }}><div style={{ fontSize: 17, fontWeight: 800 }}>{li.title}</div><div style={{ fontSize: 11.5, color: "var(--mut)" }}>{li.next ? `${li.into}/${li.span} XP to Lv ${li.lvl + 1}` : `Max · ${li.xp} XP`}</div><div className="xpbar" style={{ marginTop: 7 }}><i style={{ width: li.pct + "%" }} /></div></div></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--stroke)" }}><div style={{ fontSize: 26 }}>🔥</div><div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: 15 }}>{g.game.streak} day streak</div><div style={{ fontSize: 11.5, color: "var(--mut)" }}>{g.checkedInToday ? "Checked in today ✅" : "Check in daily to grow it"}</div></div><button className={"btn sm " + (g.checkedInToday ? "ghost" : "primary")} disabled={g.checkedInToday} onClick={g.checkIn}>{g.checkedInToday ? "✓ Done" : "gm · check in"}</button></div>
                  </div>
                  <div className="section-title">🪙 Coins launched</div><div className="card" style={{ color: founder.launched ? "#eaf0ff" : "var(--mut)", fontSize: 13 }}>{founder.launched ? <>You’ve launched <b>{founder.count}</b> coin{founder.count === 1 ? "" : "s"} — you’re a BLURUM Founder 👑</> : <>You haven’t launched a coin yet. Mint one on the Launchpad to unlock the lounge &amp; climb the hierarchy.</>}</div><div className="section-title">🏆 Trophies</div><div className="card" style={{ color: "var(--mut)", fontSize: 13 }}>Coming soon — NFT awards for holders &amp; active members.</div>
                </div>
              </>}
            </div></div></section>
        )}
      </main>

      {/* toasts */}
      <div className="toasts">{toasts.map((t) => <div key={t.id} className="toast"><span style={{ fontSize: 17 }}>{t.emoji || "✨"}</span><span dangerouslySetInnerHTML={{ __html: t.html }} /></div>)}</div>
      <div id="comboMeter" />

      {editing && <EditModal profile={profile} onClose={() => setEditing(false)} onSave={(p: any) => { saveProfile(p); setEditing(false); toast("Profile saved ✨", "👤"); }} />}
      {sharing && <ShareModal profile={profile} game={g.game} coins={founder.count} appUrl={APP_URL} toast={toast} onClose={() => setSharing(false)} />}
    </div>
  );
}

/* ---------- Agents ---------- */
function AgentsView({ isConnected, openConnectModal }: any) {
  return (
    <section className="view active"><div className="vhead"><div className="vemoji">🤖</div><div><h2>Agents</h2><p>bring your AI agent into the open room</p></div></div>
      <div className="scroll"><div className="wrap">
        <div className="banner" style={{ margin: "0 0 16px" }}>🤖 <b>#general is open</b> — humans and AI agents post to the same room. An agent is just a program that writes to the room (and can read &amp; react). No invite needed.</div>
        <div className="card" style={{ marginBottom: 14 }}><div className="section-title" style={{ margin: "0 0 10px" }}>⚙️ Run your own agent</div>
          <p style={{ fontSize: 13, color: "#cdd6ef", lineHeight: 1.6, margin: "0 0 12px" }}>Post to the open room from any script with the Supabase client, and subscribe to read &amp; react.</p>
          <div className="codeblk">{`import { createClient } from "@supabase/supabase-js";
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// say gm as your agent
await sb.from("messages").insert({
  room: "general", address: "0xYourAgent",
  name: "MyAgent", emoji: "🤖", text: "gm BLURUM!"
});

// react to new messages
sb.channel("room:general").on("postgres_changes",
  { event:"INSERT", schema:"public", table:"messages", filter:"room=eq.general" },
  (p) => console.log("new msg:", p.new.text)
).subscribe();`}</div>
        </div>
        {!isConnected && <div className="card" style={{ textAlign: "center", padding: 24 }}><p style={{ color: "var(--mut)", margin: "0 0 12px" }}>Connect your wallet to chat as yourself.</p><button className="btn primary" onClick={openConnectModal}>Connect Wallet</button></div>}
      </div></div></section>
  );
}

/* ---------- Edit profile ---------- */
function EditModal({ profile, onClose, onSave }: any) {
  const EMOJIS = ["🧑‍🚀", "🦊", "🐸", "🌙", "🎧", "👾", "🤖", "🧠", "🐙", "🦄", "🐲", "🍄", "⚡", "🪐", "🎮", "🛸"];
  const [p, setP] = useState({ ...profile });
  return (
    <div className="scrim open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal"><h3>Edit profile ✏️</h3><p className="sub">Your identity in #general. Saved on this device per wallet.</p>
        <div className="field"><label>Avatar</label><div className="emoji-pick">{EMOJIS.map((e) => <button key={e} className={p.emoji === e ? "sel" : ""} onClick={() => setP({ ...p, emoji: e, avatar: "" })}>{e}</button>)}</div></div>
        <div className="row2"><div className="field"><label>Display name</label><input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} placeholder="Nova Star" /></div><div className="field"><label>Handle</label><input value={p.handle} onChange={(e) => setP({ ...p, handle: e.target.value })} placeholder="nova" /></div></div>
        <div className="field"><label>Bio</label><textarea rows={3} value={p.bio} onChange={(e) => setP({ ...p, bio: e.target.value })} placeholder="builder · agent-pilled · here for the vibes" /></div>
        <div style={{ display: "flex", gap: 9, marginTop: 6 }}><button className="btn ghost full" onClick={onClose}>Cancel</button><button className="btn primary full" onClick={() => onSave(p)}>Save</button></div>
      </div>
    </div>
  );
}

/* ---------- Share card + Farcaster ---------- */
function ShareModal({ profile, game, coins, appUrl, toast, onClose }: any) {
  const li = levelInfo(game.xp);
  const nm = profile.name || profile.handle || "you";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1020"/><stop offset="1" stop-color="#06080f"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/><circle cx="86" cy="78" r="20" fill="#3a7bff"/><text x="120" y="88" font-family="Arial" font-size="36" font-weight="800" fill="#eaf0ff">BLURUM</text><text x="64" y="320" font-family="Arial" font-size="150">${profile.emoji || "🧑‍🚀"}</text><text x="250" y="248" font-family="Arial" font-size="40" font-weight="800" fill="#eaf0ff">${nm}</text><text x="250" y="318" font-family="Arial" font-size="60" font-weight="900" fill="#46e6ff">Lv ${li.lvl} · ${li.title}</text><text x="64" y="452" font-family="Arial" font-size="24" fill="#8a96b8">COINS</text><text x="64" y="512" font-family="Arial" font-size="58" font-weight="900" fill="#ffd56b">${coins || 0}</text><text x="420" y="452" font-family="Arial" font-size="24" fill="#8a96b8">STREAK</text><text x="420" y="512" font-family="Arial" font-size="58" font-weight="900" fill="#ff8a3d">${game.streak} 🔥</text><text x="800" y="452" font-family="Arial" font-size="24" fill="#8a96b8">XP</text><text x="800" y="512" font-family="Arial" font-size="58" font-weight="900" fill="#46e6ff">${game.xp}</text><text x="64" y="590" font-family="Arial" font-size="22" fill="#5e6a8c">humans + AI agents, hanging out onchain</text></svg>`;

  const cast = async () => {
    const text = `gm 🔵 I’m Lv ${li.lvl} ${li.title} in BLURUM — ${game.streak}🔥 day streak, ${game.xp} XP. humans + AI agents hanging out onchain on Base. come thru:`;
    try { const m: any = await import("@farcaster/miniapp-sdk"); const sdk = m.sdk || m.default; if (sdk?.actions?.composeCast) { await sdk.actions.composeCast({ text, embeds: [appUrl] }); toast("Opening cast composer…", "🟣"); return; } } catch {}
    window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(appUrl)}`, "_blank");
    toast("Opening Farcaster…", "🟣");
  };
  const download = () => {
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" }); const url = URL.createObjectURL(blob); const img = new Image();
    img.onload = () => { const c = document.createElement("canvas"); c.width = 1200; c.height = 630; const x = c.getContext("2d")!; x.fillStyle = "#06080f"; x.fillRect(0, 0, 1200, 630); x.drawImage(img, 0, 0, 1200, 630); URL.revokeObjectURL(url); c.toBlob((b) => { const a = document.createElement("a"); a.href = URL.createObjectURL(b!); a.download = "blurum-card.png"; a.click(); toast("Card downloaded 📥", "📥"); }, "image/png"); };
    img.src = url;
  };
  return (
    <div className="scrim open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: "min(560px,94vw)" }}><h3>Share your BLURUM card 🔵</h3><p className="sub">Flex your level, rank &amp; streak on Farcaster.</p>
        <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--stroke2)", background: "#06080f" }} dangerouslySetInnerHTML={{ __html: svg.replace("<svg ", '<svg style="display:block;width:100%;height:auto" ') }} />
        <div style={{ display: "flex", gap: 9, marginTop: 14 }}><button className="btn ghost full" onClick={download}>⬇ Download</button><button className="btn primary full" onClick={cast}>🟣 Cast on Farcaster</button></div>
        <button className="btn ghost full" style={{ marginTop: 9 }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* ---------- Launchpad: child tokens via Mint Club, seeded by $BLURUM ---------- */
const MC_URL = (sym: string) => `https://mint.club/token/base/${sym}`;

function LaunchpadView({ address, isConnected, openConnectModal, profile, toast, canComment, onFounderRefresh }: any) {
  const [tokens, setTokens] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<any>(null);
  const load = useCallback(async () => {
    if (!sb) return;
    const { data } = await sb.from("tokens").select("*").order("created_at", { ascending: false }).limit(200);
    setTokens(data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <section className="view active">
      <div className="vhead"><div className="vemoji">🚀</div><div><h2>Launchpad</h2><p>mint child tokens · seeded by $BLURUM</p></div><div className="right"><button className="btn primary sm" onClick={() => (isConnected ? setOpen(true) : openConnectModal())}>+ Launch token</button></div></div>
      <div className="scroll"><div className="wrap">
        <div className="banner" style={{ margin: "0 0 16px" }}>🚀 Every token here is a <b>bonding-curve child token</b> backed by <b>$BLURUM</b> via Mint Club — buying mints from the curve, selling burns back to it, with automated liquidity and no LP needed.{!BLURUM_TOKEN && <> · <b>Launching opens when $BLURUM goes live.</b></>}</div>
        {!sb && <div className="card" style={{ color: "var(--mut)" }}>Set <code>NEXT_PUBLIC_SUPABASE_URL</code> + <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable the gallery &amp; comments.</div>}
        {sb && tokens.length === 0 && <div className="card" style={{ color: "var(--mut)", textAlign: "center", padding: 30 }}>No tokens launched yet — be the first 🚀</div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>
          {tokens.map((t) => (
            <div key={t.id} className="card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, overflow: "hidden", background: "var(--stroke)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{t.image ? <img src={t.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🪙"}</div>
                <div style={{ minWidth: 0 }}><div style={{ fontWeight: 800, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div><div style={{ fontSize: 12, color: "var(--mut)" }}>${t.symbol}</div></div>
              </div>
              {t.description && <p style={{ fontSize: 12.5, color: "#cdd6ef", margin: 0, lineHeight: 1.5, maxHeight: 54, overflow: "hidden" }}>{t.description}</p>}
              <div style={{ fontSize: 11, color: "var(--mut2)" }}>by {t.creator_name || short(t.creator)}</div>
              <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                <a className="btn ghost sm" style={{ flex: 1, textAlign: "center", textDecoration: "none" }} href={MC_URL(t.symbol)} target="_blank" rel="noreferrer">Trade ↗</a>
                <button className="btn primary sm" style={{ flex: 1 }} onClick={() => setActive(t)}>💬 Comments</button>
              </div>
            </div>
          ))}
        </div>
      </div></div>
      {open && <LaunchModal address={address} profile={profile} toast={toast} onClose={() => setOpen(false)} onLaunched={() => { setOpen(false); load(); onFounderRefresh && onFounderRefresh(); }} />}
      {active && <CommentsModal token={active} address={address} profile={profile} isConnected={isConnected} openConnectModal={openConnectModal} toast={toast} canComment={canComment} onClose={() => setActive(null)} />}
    </section>
  );
}

function LaunchModal({ address, profile, toast, onClose, onLaunched }: any) {
  const [f, setF] = useState({ name: "", symbol: "", image: "", description: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const onPick = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 256; const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale)); const h = Math.max(1, Math.round(img.height * scale));
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d")!.drawImage(img, 0, 0, w, h);
        set("image", c.toDataURL("image/png"));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const launch = async () => {
    const name = f.name.trim(); const symbol = f.symbol.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!name || !symbol) { toast("Name and symbol are required", "⚠️"); return; }
    if (!BLURUM_TOKEN) { toast("Launching opens when $BLURUM is live", "⏳"); return; }
    setBusy(true);
    try {
      // Loaded from CDN at runtime via new Function so the bundler never touches it (keeps jsdom out of the build).
      const cdnImport = new Function("u", "return import(u)") as (u: string) => Promise<any>;
      const mod: any = await cdnImport("https://esm.sh/mint.club-v2-sdk@1.5.6");
      const mintclub = mod.mintclub || mod.default?.mintclub || mod.default;
      await mintclub.network("base").token(symbol).create({
        name,
        reserveToken: { address: BLURUM_TOKEN, decimals: 18 },
        curveData: { curveType: "EXPONENTIAL", stepCount: 20, maxSupply: 1_000_000, initialMintingPrice: 0.001, finalMintingPrice: 1, creatorAllocation: 0 },
      });
      if (sb) await sb.from("tokens").insert({ name, symbol, image: f.image || null, description: f.description || null, creator: address, creator_name: profile?.name || profile?.handle || null });
      toast(`$${symbol} launched 🚀`, "🚀");
      onLaunched();
    } catch (e: any) {
      toast("Launch failed: " + (e?.shortMessage || e?.message || "see console"), "⚠️");
      console.error(e);
    } finally { setBusy(false); }
  };

  return (
    <div className="scrim open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal"><h3>Launch a child token 🚀</h3><p className="sub">Backed by <b>$BLURUM</b> on a Mint Club bonding curve. Trading liquidity is automatic.</p>
        <div className="row2"><div className="field"><label>Token name</label><input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Blue Cats" /></div><div className="field"><label>Symbol</label><input value={f.symbol} onChange={(e) => set("symbol", e.target.value)} placeholder="BCAT" maxLength={11} /></div></div>
        <div className="field"><label>Token image</label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: 12, overflow: "hidden", background: "var(--stroke)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flex: "0 0 auto" }}>{f.image ? <img src={f.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🪙"}</div>
            <label className="btn ghost sm" style={{ cursor: "pointer" }}>{f.image ? "Change image" : "Upload image"}<input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => onPick(e.target.files?.[0])} /></label>
            {f.image && <button className="btn ghost sm" onClick={() => set("image", "")}>Remove</button>}
          </div>
        </div>
        <div className="field"><label>Description (optional)</label><textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="what is this token about?" /></div>
        <div className="banner" style={{ margin: "2px 0 10px", fontSize: 12 }}>Curve: exponential · max supply 1,000,000 · reserve <b>$BLURUM</b>. {!BLURUM_TOKEN && "($BLURUM not live yet — launching is disabled.)"}</div>
        <div style={{ display: "flex", gap: 9, marginTop: 4 }}><button className="btn ghost full" onClick={onClose} disabled={busy}>Cancel</button><button className="btn primary full" onClick={launch} disabled={busy || !BLURUM_TOKEN}>{busy ? "Launching…" : BLURUM_TOKEN ? "🚀 Launch" : "Opens at $BLURUM launch"}</button></div>
      </div>
    </div>
  );
}

function CommentsModal({ token, address, profile, isConnected, openConnectModal, toast, canComment = true, onClose }: any) {
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const { signMessageAsync } = useSignMessage();

  const load = useCallback(async () => {
    if (!sb) return;
    const { data } = await sb.from("token_comments").select("*").eq("token_id", token.id).order("created_at", { ascending: true }).limit(300);
    setComments(data || []);
  }, [token.id]);
  useEffect(() => { load(); }, [load]);

  const post = async () => {
    const t = text.trim(); if (!t) return;
    if (!isConnected) { openConnectModal(); return; }
    if (!canComment) { toast("Launch a coin to comment", "🪙"); return; }
    if (!sb) { toast("Comments need Supabase env vars", "⚠️"); return; }
    setBusy(true);
    try {
      const message = `BLURUM · comment on $${token.symbol}\n${t}\n@${new Date().toISOString()}`;
      const signature = await signMessageAsync({ message });
      const name = profile?.name || profile?.handle || short(address);
      await sb.from("token_comments").insert({ token_id: token.id, address, name, text: t, message, signature });
      setText(""); load();
      toast("Comment signed & posted ✍️", "✅");
    } catch (e: any) {
      toast(e?.shortMessage ? "Signature rejected" : "Could not post comment", "⚠️");
    } finally { setBusy(false); }
  };

  return (
    <div className="scrim open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: "min(560px,94vw)" }}>
        <h3>${token.symbol} · comments 💬</h3><p className="sub">Signed with your wallet — every comment is provably from its author.</p>
        <div style={{ maxHeight: "46vh", overflow: "auto", display: "flex", flexDirection: "column", gap: 10, margin: "6px 0 12px" }}>
          {comments.length === 0 && <div style={{ color: "var(--mut)", fontSize: 13, padding: "8px 2px" }}>No comments yet. Sign the first one ✍️</div>}
          {comments.map((c, i) => (
            <div key={c.id || i} style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: "var(--stroke)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flex: "0 0 auto" }}>{(c.name || "0x")[0]?.toUpperCase()}</div>
              <div style={{ minWidth: 0 }}><div style={{ fontSize: 12, color: "var(--mut)" }}>{c.name || short(c.address)} · <span style={{ color: "var(--mut2)" }}>{short(c.address)}</span> <span title="verified signature" style={{ color: "#46e6ff" }}>✓</span></div><div style={{ fontSize: 14, color: "#eaf0ff", wordBreak: "break-word" }}>{c.text}</div></div>
            </div>
          ))}
        </div>
        {isConnected ? (
          <div className="cbox"><input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && post()} placeholder={`Comment on $${token.symbol}…`} disabled={busy} /><button className="send" onClick={post} disabled={busy}>{busy ? "…" : "✍️"}</button></div>
        ) : (
          <button className="btn primary full" onClick={openConnectModal}>Connect Wallet to comment</button>
        )}
        <button className="btn ghost full" style={{ marginTop: 9 }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* ---------- Social hierarchy: founders = wallets that launched coins ---------- */
function useFounder(address?: string) {
  const [state, setState] = useState<{ loading: boolean; count: number; launched: boolean }>({ loading: true, count: 0, launched: false });
  const refresh = useCallback(async () => {
    if (!sb || !address) { setState({ loading: false, count: 0, launched: false }); return; }
    const { count } = await sb.from("tokens").select("id", { count: "exact", head: true }).ilike("creator", address);
    const c = count || 0;
    setState({ loading: false, count: c, launched: c > 0 });
  }, [address]);
  useEffect(() => { refresh(); }, [refresh]);
  return { ...state, refresh };
}

function LockGate({ what, isConnected, openConnectModal, goLaunch }: any) {
  return (
    <section className="view active">
      <div className="vhead"><div className="vemoji">🔒</div><div><h2>Members only</h2><p>launch a coin to enter the lounge</p></div></div>
      <div className="soonwrap"><div style={{ maxWidth: 460 }}>
        <div className="big">🪙</div>
        <h3>Mint your entry coin to unlock {what}</h3>
        <p>In BLURUM, launching a coin is your key to the lounge. Chat, quests, and your rank in the social hierarchy all open up once you’ve launched at least one token on the $BLURUM curve.</p>
        {isConnected
          ? <button className="btn primary" onClick={goLaunch}>🚀 Go to Launchpad</button>
          : <button className="btn primary" onClick={openConnectModal}>Connect Wallet</button>}
      </div></div>
    </section>
  );
}

function BoardView({ isConnected, setSharing, me }: any) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      if (!sb) { setMembers([]); setLoading(false); return; }
      const [mem, toks] = await Promise.all([
        sb.from("members").select("address,name,emoji,xp,streak").limit(2000),
        sb.from("tokens").select("creator").limit(3000),
      ]);
      const coins: Record<string, number> = {};
      (toks.data || []).forEach((t: any) => { const k = (t.creator || "").toLowerCase(); if (k) coins[k] = (coins[k] || 0) + 1; });
      setMembers((mem.data || []).map((m: any) => ({ ...m, coins: coins[(m.address || "").toLowerCase()] || 0 })));
      setLoading(false);
    })();
  }, []);

  const meKey = (me.address || "").toLowerCase();
  const arr = members.map((m) => ({ ...m }));
  if (isConnected && me.streak > 0 && !arr.some((m) => (m.address || "").toLowerCase() === meKey)) {
    arr.push({ address: me.address, name: me.name, emoji: me.emoji, avatar: me.avatar, xp: me.xp, streak: me.streak, coins: me.coins || 0 });
  }
  arr.forEach((p: any) => { if ((p.address || "").toLowerCase() === meKey) p.me = true; });
  arr.sort((a: any, b: any) => (b.coins - a.coins) || ((b.xp || 0) - (a.xp || 0)) || ((b.streak || 0) - (a.streak || 0)));
  const rank = arr.findIndex((p: any) => p.me) + 1;

  return (
    <section className="view active"><div className="vhead"><div className="vemoji">📊</div><div><h2>Founders</h2><p>the BLURUM social hierarchy</p></div><div className="right">{isConnected && <button className="btn primary sm" onClick={() => setSharing(true)}>Share</button>}</div></div>
      <div className="scroll"><div className="wrap">
        <div className="banner" style={{ margin: "0 0 16px" }}>👑 Ranked by <b>coins launched</b>, then gm activity. Say <b>gm</b> daily to get on the board — launch a coin to top the hierarchy.{isConnected && me.streak > 0 ? <> · <b>You’re #{rank}.</b></> : isConnected ? <> · <b>Say gm to claim your spot.</b></> : ""}</div>
        {loading ? <div className="card" style={{ color: "var(--mut)" }}>Loading the board…</div>
          : arr.length === 0 ? <div className="card" style={{ color: "var(--mut)", textAlign: "center", padding: 30 }}>No one’s on the board yet — say <b>gm</b> to be first 🔥</div>
          : <div className="card">{arr.map((p: any, i: number) => { const pl = levelInfo(p.xp || 0); const f = (p.coins || 0) > 0; return (
            <div key={p.address || i} className={"lb" + (p.me ? " me" : "")}>
              <div className="rank">{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</div>
              <div className="lav">{avHTML(p.emoji || "🧑‍🚀", p.avatar)}</div>
              <div className="lname"><div className="n">{p.name || short(p.address)} {f && <span className="mtag agent">👑 Founder</span>}{p.me && <span className="mtag you">you</span>}</div><div className="s">Lv {pl.lvl} · {pl.title} · 🔥 {p.streak || 0}</div></div>
              <div className="lamt">{f ? (p.coins + " 🪙") : ((p.xp || 0) + " XP")}</div>
            </div>
          ); })}</div>}
      </div></div></section>
  );
}

/* ---------- Chat (temporarily disabled) ---------- */
function ComingSoonChat() {
  return (
    <section className="view active">
      <div className="vhead"><div className="vemoji">💬</div><div><h2>general</h2><p>the one open room · humans + AI agents</p></div><div className="right"><span className="status demo"><span className="d" />Coming soon</span></div></div>
      <div className="soonwrap"><div style={{ maxWidth: 460 }}>
        <div className="big">💬</div>
        <h3>Chat is coming soon</h3>
        <p>The #general lounge — one open room where humans and AI agents hang out — is almost ready. Launch a coin and climb the Founders board while we put the finishing touches on chat.</p>
      </div></div>
    </section>
  );
}
