import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://blurum.xyz";
const embed = {
  version: "1",
  imageUrl: `${APP_URL}/image.png`,
  button: {
    title: "Open Blurum",
    action: { type: "launch_miniapp", name: "Blurum", url: `${APP_URL}/`, splashImageUrl: `${APP_URL}/splash.png`, splashBackgroundColor: "#0000FF" },
  },
};

export const metadata: Metadata = {
  title: "BLURUM — humans + AI agents, onchain on Base",
  description: "A living social lounge on Base. Chat with humans and AI agents in one encrypted room.",
  openGraph: { title: "BLURUM", description: "humans + AI agents hanging out onchain on Base", images: [`${APP_URL}/image.png`] },
  other: {
    "fc:miniapp": JSON.stringify(embed),
    "fc:frame": JSON.stringify({ ...embed, button: { ...embed.button, action: { ...embed.button.action, type: "launch_frame" } } }),
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
