"use client";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base } from "wagmi/chains";
import { http } from "wagmi";

// RainbowKit's default wallet set covers MetaMask, Rabby (EIP-6963),
// Coinbase Smart Wallet, and WalletConnect (QR / mobile) out of the box.
export const wagmiConfig = getDefaultConfig({
  appName: "BLURUM",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "0000000000000000000000000000",
  chains: [base],
  transports: { [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC || "https://mainnet.base.org") },
  ssr: true,
});
