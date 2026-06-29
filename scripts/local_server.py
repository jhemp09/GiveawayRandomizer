"""
Small local API that the deployed website calls (via a Cloudflare tunnel)
to trigger the TikTok comment fetcher on this machine, since the scraper
needs a real visible browser that can't run on Vercel.

Run with:
    python local_server.py

Then expose it with:
    cloudflared tunnel --url http://localhost:5000

Protects the /fetch endpoint with a shared secret (FETCH_API_SECRET in
.env) sent as the X-API-Key header, since the tunnel URL is public.
"""

import asyncio
import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

from tiktok_comment_picker import fetch_comments, upsert_to_supabase

load_dotenv()

app = Flask(__name__)
CORS(app)

API_SECRET = os.environ["FETCH_API_SECRET"]


@app.route("/fetch", methods=["POST"])
def fetch():
    if request.headers.get("X-API-Key") != API_SECRET:
        return jsonify({"error": "unauthorized"}), 401

    data = request.get_json(silent=True) or {}
    video_url = data.get("video_url")
    if not video_url:
        return jsonify({"error": "video_url is required"}), 400

    rows = asyncio.run(fetch_comments(video_url))

    if not rows:
        return jsonify({"error": "No comments found (or fetch failed)."}), 502

    unique_count = len({row["user_id"] for row in rows})
    upsert_to_supabase(video_url, rows)

    return jsonify(
        {
            "video_url": video_url,
            "comments_fetched": len(rows),
            "unique_commenters": unique_count,
        }
    )


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
