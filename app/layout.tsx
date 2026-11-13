import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ServiceWorker } from "./service-worker";
import "./globals.css";
import "./theme.css";

// Inter is the only web font; Helvetica Neue / Helvetica lead headings, as on the Anargya website.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap", adjustFontFallback: true });

export const metadata: Metadata = {
  title: "Anargya Live Telemetry",
  description: "Anargya live telemetry dashboard for the Formula Student EV. This build shows simulated sensor readings.",
  manifest: "/manifest.webmanifest",
  applicationName: "Anargya Telemetry",
  appleWebApp: { capable: true, title: "Anargya Telemetry", statusBarStyle: "black-translucent" },
  icons: {
    icon: "/anargya-app-icon-512.png",
    apple: "/anargya-app-icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#080a0d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ServiceWorker />
        {children}
      </body>
    </html>
  );
}
