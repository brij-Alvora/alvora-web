"use client";

import { useEffect, useState } from "react";

import { subscribeToToasts, type ToastMessage } from "@/lib/toast";
import { cn } from "@/lib/utils";

export function Toaster() {
  const [items, setItems] = useState<ToastMessage[]>([]);

  useEffect(() => {
    return subscribeToToasts((item) => {
      setItems((current) => [...current.slice(-4), item]);
      window.setTimeout(() => {
        setItems((current) => current.filter((row) => row.id !== item.id));
      }, 4200);
    });
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(100%-2rem,22rem)] flex-col gap-2">
      {items.map((item) => (
        <p
          key={item.id}
          className={cn(
            "pointer-events-auto rounded-md border px-3 py-2 text-sm shadow-sm",
            item.tone === "error"
              ? "border-destructive/40 bg-background text-destructive"
              : "border-border bg-background text-foreground",
          )}
        >
          {item.title}
        </p>
      ))}
    </div>
  );
}
