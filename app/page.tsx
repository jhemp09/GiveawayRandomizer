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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoUrl) return;
    setLoading(true);
    setError(null);
    getUniqueCommenters(videoUrl)
      .then((data) => setUsers(data))
      .catch((err) => setError(err.message ?? "Failed to load commenters."))
      .finally(() => setLoading(false));
  }, [videoUrl]);

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
          onClick={() => setVideoUrl(inputValue)}
          className="rounded-lg border border-gray-400 bg-white px-4 py-2 text-sm"
        >
          Load
        </button>
      </div>

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
