"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SortOption = {
  value: string;
  label: string;
};

type FilterOption = {
  name: string;
  label: string;
  options: SortOption[];
};

type AdminToolbarProps = {
  placeholder?: string;
  sortOptions: SortOption[];
  filters?: FilterOption[];
};

export function AdminToolbar({
  placeholder = "Search",
  sortOptions,
  filters = [],
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
        for (const filter of filters) {
          const value = String(form.get(filter.name) ?? "").trim();
          if (value) next.set(filter.name, value);
          else next.delete(filter.name);
        }
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
      {filters.map((filter) => (
        <select
          key={filter.name}
          name={filter.name}
          defaultValue={params.get(filter.name) ?? ""}
          aria-label={filter.label}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">{filter.label}</option>
          {filter.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}
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
