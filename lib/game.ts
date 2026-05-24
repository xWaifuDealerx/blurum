"use client";
import { useCallback, useEffect, useState } from "react";

export const LEVELS = [
  { min: 0, title: "Newcomer" }, { min: 100, title: "Regular" }, { min: 250, title: "Insider" },
  { min: 500, title: "Lounge Local" }, { min: 1000, title: "Vibe Curator" }, { min: 2000, title: "BLURUM OG" },
  { min: 4000, title: "Lounge Legend" }, { min: 8000, title: "Lounge Deity" },
];
export function levelInfo(xp: number) {
  xp = xp || 0; let i = 0;
  for (let k = 0; k < LEVELS.length; k++) if (xp >= LEVELS[k].min) i = k;
  const cur = LEVELS[i], next = LEVELS[i + 1] || null;
  const into = xp - cur.min, span = next ? next.min - cur.min : 1;
  return { lvl: i + 1, title: cur.title, next, into, span, pct: next ? Math.min(100, Math.round((into / span) * 100)) : 100, xp };
}
export const DAILY = [
  { id: "msg5", icon: "💬", name: "Send 5 messages", target: 5, xp: 20, field: "msgs" },
  { id: "checkin", icon: "🔥", name: "Daily check-in", target: 1, xp: 10, field: "checkin" },
  { id: "react3", icon: "⚡", name: "React 3 times", target: 3, xp: 15, field: "reacts" },
];
export const ONBOARD = [
  { flag: "connect", icon: "🪪", name: "Connect your wallet" },
  { flag: "profile", icon: "🎨", name: "Set up your profile" },
  { flag: "firstmsg", icon: "💬", name: "Send your first message" },
  { flag: "checkin1", icon: "🔥", name: "Do your first daily check-in" },
  { flag: "agent", icon: "🤖", name: "Add an agent to #general" },
];
const dayStr = (d = new Date()) => d.toISOString().slice(0, 10);
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayStr(d); };
const blank = () => ({ xp: 0, streak: 0, lastCheckIn: "", once: {} as any, msgXp: 0, msgDate: "", q: { date: "", msgs: 0, reacts: 0, checkin: 0, done: {} as any } });

/* ---- celebratory DOM fx (client only) ---- */
export function confetti() {
  if (typeof document === "undefined") return;
  const cols = ["#3a7bff", "#46e6ff", "#8a7bff", "#ffd56b", "#39e6a8"];
  for (let i = 0; i < 72; i++) { const c = document.createElement("div"); c.className = "confetti"; c.style.left = Math.random() * 100 + "vw"; c.style.background = cols[i % cols.length]; c.style.animationDuration = 1.5 + Math.random() * 1.5 + "s"; c.style.animationDelay = Math.random() * 0.3 + "s"; document.body.appendChild(c); setTimeout(() => c.remove(), 3200); }
}
function levelUpFx(lvl: number) {
  if (typeof document === "undefined") return; confetti();
  const info = LEVELS[lvl - 1] || { title: "" };
  const o = document.createElement("div"); o.className = "levelup";
  o.innerHTML = `<div class="lu"><div style="font-size:13px;letter-spacing:2px;color:var(--cyan);text-transform:uppercase">Level up!</div><div style="font-size:30px;font-weight:900;margin:6px 0">Lv ${lvl}</div><div style="font-size:16px;font-weight:700;color:var(--gold)">${info.title}</div></div>`;
  document.body.appendChild(o); setTimeout(() => { o.style.transition = ".4s"; o.style.opacity = "0"; setTimeout(() => o.remove(), 400); }, 1700);
}
function xpFloat(amount: number) {
  if (typeof document === "undefined") return;
  const el = document.createElement("div"); el.className = "xpfloat"; el.textContent = "+" + amount + " XP";
  el.style.left = window.innerWidth / 2 + "px"; el.style.top = window.innerHeight - 130 + "px";
  document.body.appendChild(el); setTimeout(() => el.remove(), 1000);
}

export function useGame(address: string | undefined, toast: (h: string, e?: string) => void) {
  const key = "blurum:game:" + (address || "guest");
  const [game, setGame] = useState<any>(blank());

  useEffect(() => {
    if (typeof window === "undefined") return;
    try { const g = JSON.parse(localStorage.getItem(key) || "null"); setGame(g ? { ...blank(), ...g } : blank()); } catch { setGame(blank()); }
  }, [key]);

  const persist = useCallback((g: any) => { try { localStorage.setItem(key, JSON.stringify(g)); } catch {} }, [key]);

  const apply = useCallback((mut: (g: any) => void, opts: { xp?: number } = {}) => {
    setGame((prev: any) => {
      const g = JSON.parse(JSON.stringify(prev));
      const before = levelInfo(g.xp).lvl;
      mut(g);
      persist(g);
      const after = levelInfo(g.xp).lvl;
      if (opts.xp) xpFloat(opts.xp);
      if (after > before) levelUpFx(after);
      return g;
    });
  }, [persist]);

  const reset = (g: any) => { const t = dayStr(); if (g.q.date !== t) g.q = { date: t, msgs: 0, reacts: 0, checkin: 0, done: {} }; };
  const evalMissions = (g: any) => {
    DAILY.forEach((m) => { if (!g.q.done[m.id] && (g.q as any)[m.field] >= m.target) { g.q.done[m.id] = true; g.xp += m.xp; toast(`Mission complete · ${m.name} +${m.xp} XP`, "✅"); } });
  };
  const checkOnboard = (g: any) => {
    const o = g.once; if (o.connect && o.profile && o.firstmsg && o.checkin1 && o.agent && !o.onboard) { o.onboard = true; g.xp += 50; confetti(); toast("Onboarding complete! +50 XP 🎉", "🎉"); }
  };

  const addXP = useCallback((amount: number) => apply((g) => { g.xp += amount; }, { xp: amount }), [apply]);
  const awardOnce = useCallback((flag: string, amount: number) => apply((g) => { if (g.once[flag]) return; g.once[flag] = true; g.xp += amount; checkOnboard(g); }, { xp: amount }), [apply]);
  const onMessage = useCallback(() => apply((g) => {
    reset(g); g.q.msgs += 1; evalMissions(g);
    if (!g.once.firstmsg) { g.once.firstmsg = true; checkOnboard(g); }
    const t = dayStr(); if (g.msgDate !== t) { g.msgDate = t; g.msgXp = 0; }
    if (g.msgXp < 100) { g.msgXp += 5; g.xp += 5; }
  }), [apply]);
  const onReact = useCallback((combo: number) => apply((g) => { reset(g); g.q.reacts += 1; evalMissions(g); g.xp += Math.min(2 * combo, 14); }), [apply]);
  const checkIn = useCallback(() => {
    let did = false;
    apply((g) => {
      const t = dayStr(); if (g.lastCheckIn === t) { toast(`🔥 ${g.streak}-day streak — come back tomorrow`, "🔥"); return; }
      g.streak = g.lastCheckIn === yesterday() ? g.streak + 1 : 1; g.lastCheckIn = t;
      const gain = 20 + Math.min(g.streak, 7) * 5; g.xp += gain;
      reset(g); g.q.checkin = 1; evalMissions(g); if (!g.once.checkin1) g.once.checkin1 = true; checkOnboard(g);
      confetti(); toast(`gm! Day ${g.streak} streak 🔥 · +${gain} XP`, "🔥"); did = true;
    });
  }, [apply]);

  const checkedInToday = game.lastCheckIn === dayStr();
  return { game, addXP, awardOnce, onMessage, onReact, checkIn, checkedInToday };
}
