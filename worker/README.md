# Visitor counter

A ~90-line Cloudflare Worker that backs the visitor badge in the bottom-right of the
site. It counts **one visit per browser per UTC day**: reloading, leaving and coming
back, or spamming the page adds nothing until the date rolls over.

Everything here fits inside Cloudflare's free tier (no card required). A *write* only
happens on a browser's first visit of a day, so the free allowance of ~1,000 writes a
day is roughly 1,000 unique visitors a day; ordinary page views are reads, which are far
more generous.

## Deploy

```sh
npm install -g wrangler        # once
wrangler login                 # opens the browser
cd worker
wrangler kv namespace create VISITS
```

Put the `id` it prints into `wrangler.toml`, then:

```sh
wrangler deploy
```

Wrangler prints a URL such as `https://sennin-visitor-counter.<you>.workers.dev`.
Put it in the site's environment and rebuild:

```sh
# .env.local at the repo root
NEXT_PUBLIC_VISITOR_COUNTER_URL=https://sennin-visitor-counter.<you>.workers.dev
```

Without that variable the badge renders nothing at all — the site never shows a
made-up number.

Once you know the site's final URL, set `ALLOWED_ORIGIN` in `wrangler.toml` to it and
redeploy, so only your own site can add to the count.

## What it stores

| Key                | Meaning                                              |
| ------------------ | ---------------------------------------------------- |
| `total`            | Running total of daily-unique visits                 |
| `day:<date>`       | That day's unique visits (expires after a year)      |
| `seen:<date>:<id>` | One browser already counted that day (expires in 48h) |

The `<id>` is a random value the browser generates for itself and keeps in
`localStorage`. It isn't linked to a person, and no IP addresses or user agents are
stored. Clearing site data produces a new id, so that browser can count once more.

## Endpoints

```
GET  /count   -> { total, today }
POST /visit   -> { total, today, counted }   body: { "id": "<random id>" }
```

## Accuracy note

KV is eventually consistent, so two visits landing in the same instant can read the same
total and one increment can be lost. At this scale that's a rare undercount. If the site
grows, move the tallies to Cloudflare D1 (also free, ~100,000 writes a day) and use
`UPDATE ... SET total = total + 1`, which can't lose a count.
