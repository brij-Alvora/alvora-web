"use client";

import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  deleteProjectAction,
  setProjectStatusAction,
} from "@/lib/actions/project";
import type { Project } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ProjectActionsMenu({ project }: { project: Project }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const run = (task: () => Promise<unknown>) => {
    startTransition(async () => {
      await task();
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="px-2"
          disabled={isPending}
          aria-label="Project actions"
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/projects/${project.id}/edit`}>Edit</Link>
        </DropdownMenuItem>
        {project.status !== "published" ? (
          <DropdownMenuItem
            disabled={isPending}
            onSelect={() => run(() => setProjectStatusAction(project.id, "published"))}
          >
            Publish
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            disabled={isPending}
            onSelect={() => run(() => setProjectStatusAction(project.id, "archived"))}
          >
            Archive
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          disabled={isPending}
          className="text-destructive focus:text-destructive"
          onSelect={() => {
            if (confirm("Delete this project? This cannot be undone.")) {
              run(() => deleteProjectAction(project.id));
            }
          }}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
