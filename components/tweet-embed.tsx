"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    twttr?: {
      widgets: {
        createTweet: (
          id: string,
          el: HTMLElement,
          options?: Record<string, unknown>
        ) => Promise<HTMLElement>;
        load: (el?: HTMLElement) => void;
      };
    };
  }
}

function getTweetId(url: string): string | null {
  const match = url.match(/status\/(\d+)/);
  return match?.[1] ?? null;
}

function loadWidgetsJs(): Promise<void> {
  if (window.twttr) return Promise.resolve();
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

export function TweetEmbed({ tweetUrl }: { tweetUrl: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const id = getTweetId(tweetUrl);
    if (!id) return;

    let cancelled = false;

    loadWidgetsJs().then(() => {
      if (cancelled || !window.twttr) return;
      el.innerHTML = "";
      window.twttr.widgets.createTweet(id, el, { conversation: "none" });
    });

    return () => {
      cancelled = true;
      el.innerHTML = "";
    };
  }, [tweetUrl]);

  return <div ref={ref} className="mt-3" />;
}
