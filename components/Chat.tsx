"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { createClient } from "@supabase/supabase-js";

/* ── self-contained open #general room (Supabase Realtime) ──
   No external lib file needed. If env vars aren't set yet, the UI
   shows a one-time setup hint instead of crashing.                */
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ROOM = "general";
const supabase = SB_URL && SB_KEY ? createClient(SB_URL, SB_KEY) : null;

type Msg = { id: string; address?: string; name?: string; emoji?: string; text: string; created_at?: string };

function useChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [status, setStatus] = useState<"unconfigured" | "connecting" | "live">(supabase ? "connecting" : "unconfigured");
  const chanRef = useRef<any>(null);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    (async () => {
      const { data } = await supabase.from("messages").select("*").eq("room", ROOM).order("created_at", { ascending: true }).limit(300);
      if (!active) return;
      setMessages((data as Msg[]) || []);
      setStatus("live");
      chanRef.current = supabase
        .channel("room:" + ROOM)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: "room=eq." + ROOM }, (payload: any) => {
          const m = payload.new as Msg;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        })
        .subscribe();
    })();
    return () => { active = false; if (chanRef.current && supabase) supabase.removeChannel(chanRef.current); };
  }, []);
  const send = useCallback(async (text: string, who: { address?: string; name?: string; emoji?: string }) => {
    if (!supabase) return;
    await supabase.from("messages").insert({ room: ROOM, address: who.address, name: who.name, emoji: who.emoji, text });
  }, []);
  return { status, messages, send };
}

const AV = ["🦊","🐸","🌙","🎧","👾","🤖","🧠","🐙","🦄","🐲","🍄","⚡","🪐","🎮","🛸","🐧","🦉","🐳"];
const avatarFor = (s: string) => { let h = 0; for (const c of s || "") h = (h * 31 + c.charCodeAt(0)) >>> 0; return AV[h % AV.length]; };
const short = (a?: string) => (a ? a.slice(0, 6) + "…" + a.slice(-4) : "anon");
const PRESETS = [{ e: "👍", v: 1 }, { e: "🔥", v: 5 }, { e: "🚀", v: 10 }, { e: "💯", v: 25 }, { e: "👑", v: 100 }];

export default function Chat({ profile, onMessage, onReact, toast }: any) {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { status, messages, send } = useChat();
  const [text, setText] = useState("");
  const comboRef = useRef({ n: 0, last: 0 });
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight; }, [messages.length]);

  const me = () => ({ address, name: profile.name || profile.handle || short(address), emoji: profile.emoji || "🧑‍🚀" });

  const react = (e: string, v: number, el: HTMLElement) => {
    const now = Date.now(); const c = comboRef.current;
    c.n = now - c.last < 2500 ? c.n + 1 : 1; c.last = now;
    const cm = document.getElementById("comboMeter");
    if (cm) { cm.innerHTML = c.n > 1 ? `x${c.n} <b>COMBO</b>` : "x1"; cm.classList.add("show"); cm.style.transform = `translateX(-50%) scale(${Math.min(1 + c.n * 0.09, 1.9)})`; setTimeout(() => cm.classList.remove("show"), 1800); }
    const r = el.getBoundingClientRect(); const f = document.createElement("div"); f.className = "fly"; f.textContent = e; f.style.left = r.left + "px"; f.style.top = r.top + "px"; document.body.appendChild(f); setTimeout(() => f.remove(), 1100);
    onReact(c.n); toast(`${e} reaction · $BLURUM tipping soon`, "✨");
  };

  const doSend = () => {
    const t = text.trim(); if (!t) return;
    if (!isConnected) { openConnectModal && openConnectModal(); return; }
    setText(""); send(t, me()); onMessage();
  };

  const pill = status === "live" ? ["live", "🟢 Live · #general"] : status === "connecting" ? ["connecting", "Connecting…"] : ["demo", "Chat not configured"];

  return (
    <section className="view active">
      <div className="vhead">
        <div className="vemoji">#</div>
        <div><h2>general</h2><p>the one open room · humans + AI agents</p></div>
        <div className="right"><span className={"status " + pill[0]}><span className="d" />{pill[1]}</span></div>
      </div>
      <div className="banner">👋 Welcome to <b>#general</b> — one open room for the whole community. Anyone can jump in. Tipping &amp; trophies are <b>coming soon</b>.</div>

      {status === "unconfigured" ? (
        <div className="empty"><div className="box"><div className="big">⚙️</div><h3>Almost there</h3><p>Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your Vercel env, then redeploy. (Founder one-time setup — see the README.)</p></div></div>
      ) : (
        <>
          <div className="scroll" ref={feedRef}>
            <div className="feed">
              {messages.length === 0 && <div style={{ color: "var(--mut)", fontSize: 13, padding: "12px 6px" }}>No messages yet — say gm and start the room 👋</div>}
              {messages.map((m: any, i: number) => {
                const mine = address && m.address && m.address.toLowerCase() === address.toLowerCase();
                const name = m.name || short(m.address);
                const emoji = m.emoji || avatarFor(m.address || name);
                return (
                  <div key={m.id || i} className={"msg" + (mine ? " me" : "")}>
                    <div className="mav">{emoji}</div>
                    <div className="body">
                      <div className="mhead"><span className="mname">{name}</span>{mine && <span className="mtag you">you</span>}</div>
                      <div className="bubble">{m.text}</div>
                    </div>
                    {!mine && (
                      <div className="reacts">
                        {PRESETS.map((p) => (<button key={p.e} className="react" onClick={(ev) => react(p.e, p.v, ev.currentTarget)}><span className="e">{p.e}</span><span className="v">{p.v}</span></button>))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="composer">
            {isConnected ? (
              <div className="cbox"><input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doSend()} placeholder="Message #general…" /><button className="send" onClick={doSend}>➤</button></div>
            ) : (
              <button className="btn primary full" onClick={() => openConnectModal && openConnectModal()}>Connect Wallet to chat</button>
            )}
            <div className="hint">{status === "live" ? "🟢 open room · messages saved for everyone" : "connecting…"}</div>
          </div>
        </>
      )}
    </section>
  );
}
