import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { video_url } = await request.json();

  if (!video_url) {
    return NextResponse.json({ error: "video_url is required" }, { status: 400 });
  }

  const fetcherUrl = process.env.FETCHER_URL;
  const fetcherKey = process.env.FETCHER_API_SECRET;

  if (!fetcherUrl || !fetcherKey) {
    return NextResponse.json(
      { error: "Fetcher is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${fetcherUrl}/fetch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": fetcherKey,
      },
      body: JSON.stringify({ video_url }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error ?? "Fetch failed." }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Could not reach the fetcher. Is it running?" },
      { status: 502 }
    );
  }
}
