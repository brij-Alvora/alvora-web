"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SortOption = {
  value: string;
  label: string;
};

type AdminToolbarProps = {
  placeholder?: string;
  sortOptions: SortOption[];
};

export function AdminToolbar({
  placeholder = "Search",
  sortOptions,
}: AdminToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const next = new URLSearchParams(params.toString());
        const q = String(form.get("q") ?? "").trim();
        const sort = String(form.get("sort") ?? "");
        if (q) next.set("q", q);
        else next.delete("q");
        if (sort) next.set("sort", sort);
        else next.delete("sort");
        startTransition(() => {
          router.push(`${pathname}?${next.toString()}`);
        });
      }}
    >
      <Input
        name="q"
        defaultValue={params.get("q") ?? ""}
        placeholder={placeholder}
        className="sm:max-w-xs"
      />
      <select
        name="sort"
        defaultValue={params.get("sort") ?? sortOptions[0]?.value ?? ""}
        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Filtering..." : "Apply"}
      </Button>
    </form>
  );
}
