import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-background px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at center, color-mix(in oklab, var(--color-ocean) 80%, transparent) 0%, var(--color-background) 62%)",
        }}
      />
      <div className="relative w-full max-w-sm rounded-xl border border-border bg-surface p-6">
        <Link
          to="/"
          className="mb-6 flex items-center gap-2 text-foreground no-underline"
        >
          <Compass className="size-5 text-accent" />
          <span className="font-display text-lg tracking-tight">
            Gleason Atlas
          </span>
        </Link>
        <h1 className="font-display text-2xl font-medium tracking-tight">
          Sign in
        </h1>
        <p className="mt-1.5 mb-6 text-sm leading-relaxed text-muted-foreground">
          Use a connected account to sign in. The atlas itself is open to
          browse without an account.
        </p>
        {authEnabled ? (
          <div className="space-y-2">
            {GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => signIn(p.providerId, { callbackURL: "/" })}
              >
                Continue with {p.label}
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sign-in is disabled.</p>
        )}
        <Link
          to="/"
          className="mt-5 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Back to the map
        </Link>
      </div>
    </main>
  );
}
