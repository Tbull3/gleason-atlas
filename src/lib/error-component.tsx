import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-6 text-center text-foreground">
      <span className="text-destructive" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={1.75} />
      </span>
      <h1 className="font-display text-xl font-medium tracking-tight">
        Something went wrong
      </h1>
      <p className="max-w-md text-sm leading-relaxed break-words text-muted-foreground">
        {error.message || "An unexpected error occurred. Try reloading the page."}
      </p>
    </main>
  );
}
