# TikTok giveaway wheel

Pulls comments off a TikTok video, stores unique commenters in Supabase, and
shows a spinning wheel to pick a random winner.

## How it works

1. `scripts/tiktok_comment_picker.py` fetches all comments on a given TikTok
   video URL and upserts them into the `comments` table in Supabase.
2. The Next.js app (`app/page.tsx`) reads unique commenters for a video URL
   from Supabase and renders a spinning wheel (`components/Wheel.tsx`) that
   picks a random winner client-side.

## Running the fetcher

```bash
cd scripts
pip install -r requirements.txt
python -m playwright install chromium
```

Create a `.env` file in `scripts/` (not committed) with:

```
SUPABASE_URL=https://sgqbcufsekeimelcfujh.supabase.co
SUPABASE_SERVICE_KEY=<service_role key, from Supabase Settings > API>
```

Then run:

```bash
python tiktok_comment_picker.py "<tiktok video url>"
```

## Running the web app

```bash
npm install
npm run dev
```

Set `.env.local` (not committed) with:

```
NEXT_PUBLIC_SUPABASE_URL=https://sgqbcufsekeimelcfujh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable/anon key>
```

Visit `/?video=<url-encoded video url>` to load the wheel for a specific
video, or paste the URL into the input field on the page.

## Deploying

Deployed on Vercel. Set the same `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars in the Vercel project settings.
