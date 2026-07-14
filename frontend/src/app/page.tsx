"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
const RETRY_DELAY_MS = 3000

export default function Home() {

  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    // Render spins the backend down after 15 minutes of inactivity, so the
    // first request can take 30-40s. Ping /health until it answers, then
    // send the user on their way.
    async function checkBackend() {
      try {
        const res = await fetch(`${API_URL}/health`);
        if (!cancelled && res.ok) {
          router.push("/dashboard");
          return;
        }
      } catch {
        // backend still waking up
      }
      if (!cancelled) {
        retryTimer = setTimeout(checkBackend, RETRY_DELAY_MS);
      }
    }

    checkBackend();

    return () => {
      cancelled = true;
      if (retryTimer !== undefined) clearTimeout(retryTimer);
    };
  }, [router]);

  return (
    <div className="flex flex-col flex-1 items-center justify-center gap-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <span className="text-lg font-medium">
        The game server is spinning up…
      </span>
      <span className="text-sm text-muted-foreground">
        This can take up to 40 seconds. You&apos;ll be redirected automatically when it&apos;s ready.
      </span>
    </div>
  );
}
