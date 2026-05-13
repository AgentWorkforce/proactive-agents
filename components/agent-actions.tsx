"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Copy, Check, FileText } from "lucide-react";

const SITE_URL = "https://proactiveagents.dev";

function ChatGPTIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z" />
      <path d="M8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z" />
      <path d="M12 2v6M12 16v6M2 12h6M16 12h6" />
    </svg>
  );
}

function ClaudeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
    >
      <path d="M16.1 7.6l-4 8.9-4-8.9h2.2l1.8 4.3 1.8-4.3h2.2Z" />
      <path
        d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 1.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17Z"
        fillRule="evenodd"
      />
    </svg>
  );
}

function PerplexityIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v12M6 12h12M8 8l8 8M16 8l-8 8" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function AgentActions({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const [available, setAvailable] = useState(false);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const mdUrl = `/posts/${slug}.md`;
  const postUrl = `${SITE_URL}/posts/${slug}/`;

  useEffect(() => {
    let cancelled = false;
    fetch(mdUrl, { method: "HEAD" })
      .then((res) => {
        if (!cancelled && res.ok) setAvailable(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [mdUrl]);

  const copyForLLM = useCallback(async () => {
    try {
      const res = await fetch(mdUrl);
      if (!res.ok) return;
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [mdUrl]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!available) return null;

  const aiPrompt = encodeURIComponent(
    `Read and discuss this essay "${title}": ${postUrl}`
  );
  const tweetText = encodeURIComponent(title);
  const tweetUrl = encodeURIComponent(postUrl);
  const linkedInUrl = encodeURIComponent(postUrl);

  return (
    <div className="agent-actions-bar">
      <div className="agent-actions-group">
        <p className="agent-actions-label">Agents</p>
        <button onClick={copyForLLM} className="agent-actions-btn">
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span>{copied ? "Copied" : "Copy for LLM"}</span>
        </button>
        <a
          href={mdUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="agent-actions-btn"
        >
          <FileText className="h-3.5 w-3.5" />
          <span>View as Markdown</span>
        </a>
      </div>

      <div className="agent-actions-group">
        <p className="agent-actions-label">Explore with AI</p>
        <a
          href={`https://chatgpt.com/?q=${aiPrompt}`}
          target="_blank"
          rel="noopener noreferrer"
          className="agent-actions-link"
        >
          <ChatGPTIcon className="h-3.5 w-3.5 shrink-0" />
          <span>Open in ChatGPT</span>
        </a>
        <a
          href={`https://claude.ai/new?q=${aiPrompt}`}
          target="_blank"
          rel="noopener noreferrer"
          className="agent-actions-link"
        >
          <ClaudeIcon className="h-3.5 w-3.5 shrink-0" />
          <span>Open in Claude</span>
        </a>
        <a
          href={`https://www.perplexity.ai/search?q=${aiPrompt}`}
          target="_blank"
          rel="noopener noreferrer"
          className="agent-actions-link"
        >
          <PerplexityIcon className="h-3.5 w-3.5 shrink-0" />
          <span>Open in Perplexity</span>
        </a>
      </div>

      <div className="agent-actions-group">
        <p className="agent-actions-label">Share</p>
        <a
          href={`https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="agent-actions-btn"
        >
          <XIcon className="h-3.5 w-3.5" />
          <span>Twitter/X</span>
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${linkedInUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="agent-actions-btn"
        >
          <LinkedInIcon className="h-3.5 w-3.5" />
          <span>LinkedIn</span>
        </a>
      </div>
    </div>
  );
}
