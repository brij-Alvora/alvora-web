"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

import { captureAcquisitionContextAction } from "@/lib/actions/acquisition";
import { gaMeasurementId, setClarityUtm } from "@/lib/analytics/client";
import { parseUtmSearch } from "@/lib/analytics/utm";

function AnalyticsScripts() {
  const gaId = gaMeasurementId();

  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());
gtag('config','${gaId}',{anonymize_ip:true,send_page_view:false});`}
      </Script>
    </>
  );
}

function AcquisitionCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const gaId = gaMeasurementId();

  useEffect(() => {
    const search = searchParams.toString();
    const utm = parseUtmSearch(search);
    setClarityUtm(utm);
    void captureAcquisitionContextAction({
      search,
      referrer: document.referrer || undefined,
    });
    if (gaId && typeof window.gtag === "function") {
      window.gtag("event", "page_view", {
        page_path: pathname,
        page_location: window.location.href,
        page_title: document.title,
      });
    }
  }, [gaId, pathname, searchParams]);

  return null;
}

export function AnalyticsProviders() {
  return (
    <>
      <AnalyticsScripts />
      <Suspense fallback={null}>
        <AcquisitionCapture />
      </Suspense>
    </>
  );
}
