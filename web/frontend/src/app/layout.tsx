import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { CompareProvider } from "@/components/CompareProvider";
import { CompareTray } from "@/components/CompareTray";
import { loadAllDistricts } from "@/lib/districts";
import { Analytics } from "@vercel/analytics/next";

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "inclusiv·ui — San Diego County school districts for autism & special ed",
  description:
    "Open data on autism inclusion, special education outcomes, and compliance across San Diego County school districts.",
  // Friends-feedback beta — shareable URL, but kept out of search indexes.
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // District names for the compare tray — pinned state stores only CDS codes.
  const profiles = await loadAllDistricts();
  const districtNames = Object.fromEntries(
    profiles.map((p) => [p.cds_code, p.name]),
  );

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--bg)] text-[var(--ink)] font-sans">
        <CompareProvider>
          <div className="mx-auto flex min-h-screen max-w-[1120px] flex-col">
            <SiteHeader />
            <main className="flex-1 px-[30px] py-[26px]">{children}</main>
            <SiteFooter />
          </div>
          <CompareTray names={districtNames} />
        </CompareProvider>
        <Analytics />
      </body>
    </html>
  );
}
