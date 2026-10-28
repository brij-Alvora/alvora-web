import type { Metadata } from "next";
import { Outfit, Source_Serif_4 } from "next/font/google";
import Script from "next/script";

import { AnalyticsProviders } from "@/components/analytics/analytics-providers";
import { clarityProjectId } from "@/lib/analytics/client";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AccountStatusBanner } from "@/components/trust/account-status-banner";
import { Toaster } from "@/components/ui/toaster";
import { getCurrentProfile } from "@/lib/profile/queries";

import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Alvora",
  description: "AI Builder Identity & Validation Platform",
  applicationName: "Alvora",
  icons: {
    icon: [{ url: "/alvora-mark.svg", type: "image/svg+xml" }],
    apple: [{ url: "/alvora-mark.svg", type: "image/svg+xml" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentProfile();
  const clarityId = clarityProjectId();
  return (
    <html lang="en">
      {clarityId ? (
        <Script id="clarity-init" strategy="beforeInteractive">
          {`(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window,document,"clarity","script","${clarityId}");`}
        </Script>
      ) : null}
      <body
        className={`${outfit.variable} ${sourceSerif.variable} flex min-h-dvh flex-col overflow-x-hidden bg-background font-sans text-foreground antialiased`}
      >
        <SiteHeader />
        {profile ? (
          <AccountStatusBanner status={profile.account_status} />
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        <SiteFooter />
        <Toaster />
        <AnalyticsProviders />
      </body>
    </html>
  );
}
