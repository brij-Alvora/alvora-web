"use client";

import { useEffect, useRef } from "react";

import { trackAcquisitionEventAction } from "@/lib/actions/acquisition";
import { trackBrowserEvent } from "@/lib/analytics/client";
import type { AcquisitionEventName } from "@/lib/analytics/events";

export function TrackAcquisitionEvent({
  eventName,
  mentorIntent = false,
}: {
  eventName: AcquisitionEventName;
  mentorIntent?: boolean;
}) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    trackBrowserEvent(eventName, { page_path: window.location.pathname });
    void trackAcquisitionEventAction({
      eventName,
      path: window.location.pathname,
      referrer: document.referrer || undefined,
      search: window.location.search,
      mentorIntent,
    });
  }, [eventName, mentorIntent]);

  return null;
}
