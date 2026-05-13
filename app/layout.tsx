import type { Metadata } from "next";
import { Inter, Fraunces, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_AUTHOR,
} from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT"],
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — What They Are and How to Build Them`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  authors: [{ name: SITE_AUTHOR, url: "https://github.com/khaliqgant" }],
  creator: SITE_AUTHOR,
  publisher: "AgentWorkforce",
  keywords: [
    "proactive agents",
    "proactive AI agents",
    "reactive vs proactive agents",
    "AI agent architecture",
    "event-driven AI agents",
    "agent triggers",
    "how to build proactive agents",
    "AI agent runtime",
    "push vs poll agents",
    "autonomous AI agents",
    "webhook agents",
    "agent state management",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — What They Are and How to Build Them`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — What They Are and How to Build Them`,
    description: SITE_DESCRIPTION,
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${instrument.variable} ${jetbrains.variable} antialiased`}
    >
      <head>
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM-readable site summary" />
      </head>
      <body className="relative min-h-screen" suppressHydrationWarning>
        <div className="paper-grain" aria-hidden />
        <div className="relative z-10 flex min-h-screen flex-col">
          <SiteNav />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Y759F1W3ZB"
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-Y759F1W3ZB');`}
        </Script>
      </body>
    </html>
  );
}
