"""
Fetch all comments on a TikTok video and upsert them into Supabase
(table: comments), keyed by (video_url, user_id) so re-runs don't duplicate.

The web app reads from this table to render the giveaway wheel for a
given video.

Note: TikTok does not expose who liked a video anywhere (web app or API) --
only the total like count is public. So this script works on the set of
unique COMMENTERS, not commenters intersected with likers.

Requires: pip install TikTokApi supabase python-dotenv
TikTokApi drives a real browser session (via Playwright) to call TikTok's
internal endpoints, so on first run you also need:
    python -m playwright install chromium

Set SUPABASE_URL and SUPABASE_SERVICE_KEY in a .env file next to this
script (service_role key, not the publishable/anon key -- it needs write
access).

Usage:
    python tiktok_comment_picker.py <video_url>
"""

import argparse
import asyncio
import os
import sys

from dotenv import load_dotenv
from supabase import create_client
from TikTokApi import TikTokApi

load_dotenv()

MS_TOKEN = None  # optional: set your ms_token cookie value here if you have one


async def fetch_comments(video_url: str) -> list[dict]:
    """Return a list of {user_id, username, comment_text} for every comment."""
    rows = []

    async with TikTokApi() as api:
        await api.create_sessions(
            ms_tokens=[MS_TOKEN] if MS_TOKEN else None,
            num_sessions=1,
            sleep_after=3,
            browser=("chromium"),
            headless=False,
        )
        video = api.video(url=video_url)

        async for comment in video.comments(count=50):
            c = comment.as_dict
            author = c.get("user", {})
            user_id = author.get("uid") or author.get("unique_id")
            username = author.get("unique_id") or author.get("nickname") or user_id
            if user_id:
                rows.append(
                    {
                        "user_id": str(user_id),
                        "username": str(username),
                        "comment_text": c.get("text", ""),
                    }
                )

    return rows


def upsert_to_supabase(video_url: str, rows: list[dict]):
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_KEY"]
    supabase = create_client(url, key)

    deduped = {row["user_id"]: row for row in rows}
    records = [
        {
            "video_url": video_url,
            "user_id": row["user_id"],
            "username": row["username"],
            "comment_text": row["comment_text"],
        }
        for row in deduped.values()
    ]

    supabase.table("comments").upsert(records, on_conflict="video_url,user_id").execute()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video_url", help="Full TikTok video URL")
    args = parser.parse_args()

    rows = asyncio.run(fetch_comments(args.video_url))

    if not rows:
        print("No comments found (or fetch failed).", file=sys.stderr)
        sys.exit(1)

    unique_users = {row["user_id"]: row["username"] for row in rows}
    print(f"Found {len(rows)} comment(s) from {len(unique_users)} unique commenter(s).")

    upsert_to_supabase(args.video_url, rows)
    print("Upserted into Supabase 'comments' table.")


if __name__ == "__main__":
    main()
