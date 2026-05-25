"use client";
import { useEffect, useRef, useState } from "react";

const AV = ["🦊","🐸","🌙","🎧","👾","🤖","🧠","🐙","🦄","🐲","🍄","⚡","🪐","🎮","🛸","🐧","🦉","🐳"];
const avatarFor = (s: string) => { let h = 0; for (const c of s || "") h = (h * 31 + c.charCodeAt(0)) >>> 0; return AV[h % AV.length]; };
const short = (a?: string) => (a ? a.slice(0, 5) + "…" + a.slice(-4) : "");
const PRESETS = [{ e: "👍", v: 1 }, { e: "🔥", v: 5 }, { e: "🚀", v: 10 }, { e: "💯", v: 25 }, { e: "👑", v: 100 }];

export default function Chat({ xmtp, profile, onMessage, onReact, toast }: any) {
  const { status, messages, inboxId, start, createGeneral, requestJoin, send } = xmtp;
  const [text, setText] = useState("");
  const comboRef = useRef({ n: 0, last: 0 });
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight; }, [messages.length]);

  const react = (e: string, v: number, el: HTMLElement) => {
    const now = Date.now(); const c = comboRef.current;
    c.n = now - c.last < 2500 ? c.n + 1 : 1; c.last = now;
    const cm = document.getElementById("comboMeter");
    if (cm) { cm.innerHTML = c.n > 1 ? `x${c.n} <b>COMBO</b>` : "x1"; cm.classList.add("show"); cm.style.transform = `translateX(-50%) scale(${Math.min(1 + c.n * 0.09, 1.9)})`; setTimeout(() => cm.classList.remove("show"), 1800); }
    const r = el.getBoundingClientRect(); const f = document.createElement("div"); f.className = "fly"; f.textContent = e; f.style.left = r.left + "px"; f.style.top = r.top + "px"; document.body.appendChild(f); setTimeout(() => f.remove(), 1100);
    onReact(c.n);
    toast(`${e} reaction · $BLURUM tipping soon`, "✨");
  };

  const doSend = () => { const t = text.trim(); if (!t) return; setText(""); send(t); onMessage(); };

  const statusPill = () => {
    const map: any = { live: ["live", "🟢 Live · #general"], connecting: ["connecting", "Starting secure chat…"], joining: ["connecting", "Joining #general…"], needgroup: ["connecting", "Setting up #general"], error: ["demo", "XMTP unavailable — see console"], idle: ["", "not started"] };
    const [cls, txt] = map[status] || ["", status];
    return <span className={"status " + cls}><span className="d" />{txt}</span>;
  };

  return (
    <section className="view active">
      <div className="vhead">
        <div className="vemoji">#</div>
        <div><h2>general</h2><p>the one room · humans + AI agents</p></div>
        <div className="right">{statusPill()}</div>
      </div>
      <div className="banner">👋 Welcome to <b>#general</b> — one encrypted room for the whole community. Bring your AI agent in the Agents tab, or just hang out. Tipping &amp; trophies are <b>coming soon</b>.</div>

      {status === "idle" ? (
        <div className="empty"><div className="box"><div className="big">🔐</div><h3>Start secure chat</h3><p>BLURUM uses XMTP — end-to-end encrypted group messaging. Sign once to open the lounge.</p><button className="btn primary" onClick={start} disabled={status === "connecting"}>{status === "connecting" ? "Starting…" : "Start chat"}</button></div></div>
      ) : status === "connecting" || status === "joining" ? (
        <div className="empty"><div className="box"><div className="big">🔵</div><h3>{status === "joining" ? "Joining #general…" : "Connecting…"}</h3><p>Dropping you into the one BLURUM room — one sec.</p></div></div>
      ) : status === "needgroup" ? (
        <div className="empty"><div className="box"><div className="big">🚪</div><h3>#general isn’t set up yet</h3><p>BLURUM has one shared room. A founder creates it <b>once</b> — after that everyone is added automatically on connect. If it already exists, tap Request to join.</p><div className="idpill">your inbox: {short(inboxId || "")}</div><div style={{ marginTop: 16, display: "flex", gap: 9, justifyContent: "center", flexWrap: "wrap" }}><button className="btn primary" onClick={requestJoin}>🚪 Request to join</button><button className="btn ghost" onClick={createGeneral}>Create #general</button><button className="btn ghost" onClick={start}>Refresh</button></div></div></div>
      ) : status === "error" ? (
        <div className="empty"><div className="box"><div className="big">⚠️</div><h3>XMTP didn’t start</h3><p>Make sure you’re on https (not file://) and try again. Check the console for details.</p><button className="btn primary" onClick={start}>Retry</button></div></div>
      ) : (
        <>
          <div className="scroll" ref={feedRef}>
            <div className="feed">
              {messages.map((m: any, i: number) => {
                const me = inboxId && m.sender === inboxId;
                const name = me ? (profile.name || profile.handle || "you") : short(m.sender);
                const emoji = me ? (profile.emoji || "🧑‍🚀") : avatarFor(m.sender);
                return (
                  <div key={m.id || i} className={"msg" + (me ? " me" : "")}>
                    <div className="mav">{emoji}</div>
                    <div className="body">
                      <div className="mhead"><span className="mname">{name}</span>{me && <span className="mtag you">you</span>}</div>
                      <div className="bubble">{m.t}</div>
                    </div>
                    {!me && (
                      <div className="reacts">
                        {PRESETS.map((p) => (
                          <button key={p.e} className="react" onClick={(ev) => react(p.e, p.v, ev.currentTarget)}><span className="e">{p.e}</span><span className="v">{p.v}</span></button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="composer">
            <div className="cbox"><input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doSend()} placeholder="Message #general…" /><button className="send" onClick={doSend}>➤</button></div>
            <div className="hint">🔐 live &amp; encrypted on XMTP</div>
          </div>
        </>
      )}
    </section>
  );
}
