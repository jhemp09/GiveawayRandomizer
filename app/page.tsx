"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getUniqueCommenters, type UniqueUser } from "@/lib/supabaseClient";
import Wheel from "@/components/Wheel";

function GiveawayPage() {
  const searchParams = useSearchParams();
  const videoFromQuery = searchParams.get("video") ?? "";

  const [videoUrl, setVideoUrl] = useState(videoFromQuery);
  const [inputValue, setInputValue] = useState(videoFromQuery);
  const [users, setUsers] = useState<UniqueUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function loadFromSupabase(url: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await getUniqueCommenters(url);
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load commenters.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!videoUrl) return;
    loadFromSupabase(videoUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoUrl]);

  async function handleLoad() {
    const url = inputValue.trim();
    if (!url) return;

    setVideoUrl(url);
    setFetching(true);
    setStatus("Fetching latest comments from TikTok...");
    setError(null);

    try {
      const res = await fetch("/api/fetch-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_url: url }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Fetch failed.");
        setStatus(null);
      } else {
        setStatus(
          `Fetched ${data.comments_fetched} comment(s), ${data.unique_commenters} unique commenter(s).`
        );
        await loadFromSupabase(url);
      }
    } catch {
      setError("Could not reach the fetcher.");
      setStatus(null);
    } finally {
      setFetching(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-10">
      <h1 className="text-xl font-semibold">Giveaway wheel</h1>

      <div className="flex w-full gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Paste TikTok video URL"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          onClick={handleLoad}
          disabled={fetching}
          className="rounded-lg border border-gray-400 bg-white px-4 py-2 text-sm disabled:opacity-50"
        >
          {fetching ? "Fetching..." : "Load"}
        </button>
      </div>

      {status && <p className="text-sm text-gray-500">{status}</p>}
      {loading && <p className="text-sm text-gray-500">Loading commenters...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && videoUrl && <Wheel users={users} />}
      {!videoUrl && (
        <p className="text-sm text-gray-500">
          Paste a video URL above, or link to this page with{" "}
          <code>?video=&lt;encoded-url&gt;</code> to load it automatically.
        </p>
      )}
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <GiveawayPage />
    </Suspense>
  );
}
