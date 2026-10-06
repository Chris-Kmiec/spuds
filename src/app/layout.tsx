import type { Metadata, Viewport } from "next";
import { Inter, Nunito } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["600", "700", "800", "900"],
});

export const metadata: Metadata = {
  // Link previews need absolute URLs; previews of preview deploys point at
  // that deploy so they can be checked before going live.
  metadataBase: new URL(
    process.env.VERCEL_ENV === "production"
      ? "https://getspuds.com"
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000"
  ),
  title: { default: "Spuds — Find your player two", template: "%s · Spuds" },
  description:
    "Spuds helps gamers build real-world friendships through shared gaming experiences. Discover gaming parties near you, join communities, and host your own.",
};

export const viewport: Viewport = {
  themeColor: "#FF6B8A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${nunito.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
