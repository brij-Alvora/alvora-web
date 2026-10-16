import { describe, expect, it } from "vitest";

import {
  extractNotificationUuid,
  notificationHref,
} from "@/lib/notifications/href";
import type { AppNotification } from "@/lib/supabase/types";

function item(overrides: Partial<AppNotification>): AppNotification {
  return {
    id: "n1",
    user_id: "u1",
    type: "support_ticket_resolved",
    title: "Support ticket closed",
    message: "Your support ticket was closed.",
    body: null,
    href: "/support",
    entity_type: "support_ticket",
    entity_id: "6b58d97d-1a4f-4ffb-966b-6b49930fe5f6",
    source_id: "6b58d97d-1a4f-4ffb-966b-6b49930fe5f6",
    is_read: true,
    read_at: "2026-10-14T00:00:00Z",
    created_at: "2026-10-14T00:00:00Z",
    ...overrides,
  };
}

describe("notification deep links", () => {
  it("opens the ticket thread instead of the create-ticket form", () => {
    expect(notificationHref(item({ href: "/support" }))).toBe(
      "/support/6b58d97d-1a4f-4ffb-966b-6b49930fe5f6",
    );
    expect(
      notificationHref(
        item({
          href: "/support/6b58d97d-1a4f-4ffb-966b-6b49930fe5f6",
        }),
      ),
    ).toBe("/support/6b58d97d-1a4f-4ffb-966b-6b49930fe5f6");
  });

  it("opens the warning thread for account warnings", () => {
    expect(
      notificationHref(
        item({
          type: "account_warned",
          href: "/support",
          entity_type: "user",
          entity_id: "warn:1",
        }),
      ),
    ).toBe("/support/warning");
  });

  it("extracts a ticket id from mixed entity values", () => {
    expect(
      extractNotificationUuid("closed:6b58d97d-1a4f-4ffb-966b-6b49930fe5f6"),
    ).toBe("6b58d97d-1a4f-4ffb-966b-6b49930fe5f6");
  });
});
