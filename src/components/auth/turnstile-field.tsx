"use client";

import { useEffect, useRef } from "react";

type TurnstileFieldProps = {
  onToken: (token: string) => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      reset: (id: string) => void;
    };
  }
}

export function TurnstileField({ onToken }: TurnstileFieldProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  useEffect(() => {
    if (!siteKey || !hostRef.current) return;

    const render = () => {
      if (!window.turnstile || !hostRef.current || widgetId.current) return;
      widgetId.current = window.turnstile.render(hostRef.current, {
        sitekey: siteKey,
        callback: (token) => onTokenRef.current(token),
        "expired-callback": () => onTokenRef.current(""),
        "error-callback": () => onTokenRef.current(""),
      });
    };

    if (window.turnstile) {
      render();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://challenges.cloudflare.com/turnstile/v0/api.js"]',
    );
    if (existing) {
      existing.addEventListener("load", render);
      return () => existing.removeEventListener("load", render);
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", render);
    document.head.appendChild(script);
    return () => script.removeEventListener("load", render);
  }, [siteKey]);

  if (!siteKey) {
    return (
      <p className="text-xs text-muted-foreground">
        CAPTCHA is skipped in this environment. Production requires Turnstile
        keys.
      </p>
    );
  }

  return <div ref={hostRef} className="flex justify-center" />;
}
