import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import AppProvider from "@/components/AppProvider";
import LedgerSidebar from "@/components/LedgerSidebar";

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
};

export default function RootLayout(props: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable} ${jetbrains.variable}`}>
      <body className="h-screen font-sans antialiased">
        <AppProvider>
          <div className="grid h-full grid-cols-[52px_1fr] sm:grid-cols-[64px_1fr]">
            <LedgerSidebar />
            <main className="h-full min-w-0 overflow-y-auto">{props.children}</main>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}