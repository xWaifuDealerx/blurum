"use client";
import { useCallback, useRef, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { toBytes, createPublicClient, http } from "viem";
import { base } from "viem/chains";

const ENV = (process.env.NEXT_PUBLIC_XMTP_ENV || "production") as any;
const GROUP_ENV = process.env.NEXT_PUBLIC_GENERAL_GROUP_ID || "";
const pub = createPublicClient({ chain: base, transport: http(process.env.NEXT_PUBLIC_BASE_RPC || "https://mainnet.base.org") });

type Msg = { id: string; sender: string; t: string; ns: number };

export function useXmtp(toast: (h: string, e?: string) => void) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [status, setStatus] = useState<"idle" | "connecting" | "needgroup" | "live" | "error">("idle");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [inboxId, setInboxId] = useState<string | null>(null);
  const clientRef = useRef<any>(null);
  const groupRef = useRef<any>(null);

  const decode = (m: any): Msg | null => {
    try { if (typeof m.content !== "string") return null; return { id: m.id, sender: m.senderInboxId, t: m.content, ns: m.sentAtNs ? Number(m.sentAtNs) : Date.now() * 1e6 }; } catch { return null; }
  };
  const sortMsgs = (a: Msg[]) => a.slice().sort((x, y) => x.ns - y.ns);

  const loadMessages = useCallback(async () => {
    const g = groupRef.current; if (!g) return;
    await g.sync(); const arr = await g.messages();
    setMessages(sortMsgs(arr.map(decode).filter(Boolean) as Msg[]));
  }, []);

  const streamLoop = useCallback(async () => {
    const g = groupRef.current; if (!g) return;
    try { const s = await g.stream(); for await (const m of s) { if (!m) continue; const d = decode(m); if (d) setMessages((p) => (p.some((x) => x.id === d.id) ? p : sortMsgs([...p, d]))); } }
    catch (e) { console.warn("[XMTP] stream", e); }
  }, []);

  const ensureGroup = useCallback(async () => {
    const c = clientRef.current; await c.conversations.sync();
    const gid = GROUP_ENV || (typeof localStorage !== "undefined" ? localStorage.getItem("blurum:groupId") : "") || "";
    let g: any = null;
    if (gid) { try { g = await c.conversations.getConversationById(gid); } catch {} }
    if (g) { groupRef.current = g; localStorage.setItem("blurum:groupId", g.id); setStatus("live"); await loadMessages(); streamLoop(); }
    else setStatus("needgroup");
  }, [loadMessages, streamLoop]);

  const start = useCallback(async () => {
    if (!address || !walletClient) return;
    try {
      setStatus("connecting");
      const { Client } = await import("@xmtp/browser-sdk");
      const idObj = { identifier: address.toLowerCase(), identifierKind: "Ethereum" as const };
      const signMessage = async (message: string) => toBytes(await walletClient.signMessage({ account: address, message }));
      // Detect a smart-contract wallet (e.g. Coinbase Smart Wallet): if the address has bytecode, it's a SCW.
      let isSCW = false;
      try { const code = await (pub as any).getCode({ address }); isSCW = !!(code && code !== "0x"); } catch {}
      const signer: any = isSCW
        ? { type: "SCW", getIdentifier: () => idObj, getChainId: () => BigInt(base.id), signMessage }
        : { type: "EOA", getIdentifier: () => idObj, signMessage };
      const client = await Client.create(signer, { env: ENV });
      clientRef.current = client; setInboxId(client.inboxId);
      await ensureGroup();
    } catch (e: any) { console.warn("[XMTP] init", e); setStatus("error"); toast("Couldn’t start XMTP — see console", "⚠️"); }
  }, [address, walletClient, ensureGroup, toast]);

  const createGeneral = useCallback(async () => {
    const c = clientRef.current; if (!c) return;
    try {
      const g = await c.conversations.newGroup([], { name: "BLURUM · #general", description: "humans + AI agents." });
      groupRef.current = g; localStorage.setItem("blurum:groupId", g.id); setStatus("live");
      toast("Created #general 🎉", "🎉"); await loadMessages(); streamLoop();
    } catch (e: any) { toast("Create failed: " + (e?.message || e), "⚠️"); }
  }, [loadMessages, streamLoop, toast]);

  const requestJoin = useCallback(async () => {
    const c = clientRef.current; if (!c) return;
    const greeter = process.env.NEXT_PUBLIC_GREETER_ADDRESS;
    if (!greeter) { toast("No greeter set yet — a founder can Create #general", "ℹ️"); return; }
    try {
      toast("Requesting access…", "🚪");
      let dm: any = null;
      try { dm = await c.conversations.newDmWithIdentifier({ identifier: greeter.toLowerCase(), identifierKind: "Ethereum" }); }
      catch { try { dm = await c.conversations.newDm(greeter); } catch {} }
      if (dm) await dm.send("join #general");
      for (let i = 0; i < 12; i++) { await new Promise((r) => setTimeout(r, 2500)); await ensureGroup(); if (groupRef.current) { toast("You’re in! 🎉", "🎉"); return; } }
      toast("Still pending — make sure the greeter agent is running, then Retry", "⏳");
    } catch (e: any) { toast("Join request failed: " + (e?.message || e), "⚠️"); }
  }, [ensureGroup, toast]);

  const send = useCallback(async (text: string) => {
    const g = groupRef.current; if (!g) return;
    try { await g.send(text); await loadMessages(); } catch { toast("Send failed", "⚠️"); }
  }, [loadMessages, toast]);

  const addMember = useCallback(async (input: string) => {
    const g = groupRef.current; if (!g) { toast("Join #general first", "⚠️"); return false; }
    try {
      const v = input.trim();
      if (/^0x[0-9a-fA-F]{40}$/.test(v)) await g.addMembersByIdentifiers([{ identifier: v.toLowerCase(), identifierKind: "Ethereum" }]);
      else await g.addMembers([v]);
      toast("Added to #general 🎉", "🤖"); return true;
    } catch (e: any) { toast("Add failed: " + (e?.message || e), "⚠️"); return false; }
  }, [toast]);

  const getMembers = useCallback(async () => { const g = groupRef.current; if (!g) return []; try { return await g.members(); } catch { return []; } }, []);

  return { status, messages, inboxId, start, createGeneral, requestJoin, send, addMember, getMembers };
}
