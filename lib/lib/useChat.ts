"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ROOM = "general";

// One shared client. If env isn't set yet, supabase is null and the UI shows a setup hint.
export const supabase = URL && KEY ? createClient(URL, KEY) : null;

export type ChatMsg = { id: string; address?: string; name?: string; emoji?: string; text: string; created_at?: string };

export function useChat() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [status, setStatus] = useState<"unconfigured" | "connecting" | "live">(supabase ? "connecting" : "unconfigured");
  const chanRef = useRef<any>(null);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    (async () => {
      // load the open room's history (everyone sees the same messages)
      const { data } = await supabase.from("messages").select("*").eq("room", ROOM).order("created_at", { ascending: true }).limit(300);
      if (!active) return;
      setMessages((data as ChatMsg[]) || []);
      setStatus("live");
      // subscribe to new messages in realtime
      chanRef.current = supabase
        .channel("room:" + ROOM)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: "room=eq." + ROOM }, (payload: any) => {
          const m = payload.new as ChatMsg;
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
