"use client";
import { createPublicClient, http, namehash, keccak256, toHex, concat } from "viem";
import { base, mainnet } from "viem/chains";

const baseClient = createPublicClient({ chain: base, transport: http(process.env.NEXT_PUBLIC_BASE_RPC || "https://mainnet.base.org") });
const ethClient = createPublicClient({ chain: mainnet, transport: http("https://eth.llamarpc.com") });
const L2_RESOLVER = "0xC6d566A56A1aFf6508b41f6c90ff131615583BCD";
const resolverAbi = [
  { type: "function", name: "name", stateMutability: "view", inputs: [{ type: "bytes32" }], outputs: [{ type: "string" }] },
  { type: "function", name: "text", stateMutability: "view", inputs: [{ type: "bytes32" }, { type: "string" }], outputs: [{ type: "string" }] },
] as const;
const ipfs = (u?: string) => (u && u.startsWith("ipfs://") ? "https://ipfs.io/ipfs/" + u.slice(7) : u);

export async function resolveName(addr: string): Promise<{ name?: string; avatar?: string }> {
  // Basename (Base)
  try {
    const parent = namehash("80002105.reverse");
    const label = keccak256(toHex(addr.toLowerCase().slice(2)));
    const node = keccak256(concat([parent, label]));
    const bn = (await baseClient.readContract({ address: L2_RESOLVER, abi: resolverAbi, functionName: "name", args: [node] })) as string;
    if (bn) {
      let avatar: string | undefined;
      try { avatar = ipfs((await baseClient.readContract({ address: L2_RESOLVER, abi: resolverAbi, functionName: "text", args: [namehash(bn), "avatar"] })) as string); } catch {}
      return { name: bn, avatar };
    }
  } catch {}
  // ENS (mainnet)
  try {
    const name = await ethClient.getEnsName({ address: addr as `0x${string}` });
    if (name) { let avatar: string | undefined; try { avatar = (await ethClient.getEnsAvatar({ name })) || undefined; } catch {} return { name, avatar }; }
  } catch {}
  return {};
}
