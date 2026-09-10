import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import AppProvider from "@/components/AppProvider";
import RootGate from "@/components/RootGate";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Resident Profiling Database",
  description: "Record and search resident profiles during barangay visits",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    title: "BEC Profiler",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#1B4D4A",
};

export default function RootLayout(props: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable} ${jetbrains.variable}`}>
      <body className="h-screen font-sans antialiased">
        <AppProvider>
          <RootGate>{props.children}</RootGate>
        </AppProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}