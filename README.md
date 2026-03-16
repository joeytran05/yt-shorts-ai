# SHORTS.AI - Automated YouTube Shorts Pipeline

An end-to-end production pipeline that discovers trending content, generates AI-written scripts, synthesises voiceovers, renders videos with stock footage and captions, and publishes directly to YouTube — all from a single dashboard.

---

## What it does

```
Discover → Score → Approve → Script → Voice → Video → Review → Publish
```

1. **Discover** — scrapes YouTube for trending Shorts across configurable niches and search queries; each video is scored by GPT-4o-mini across four dimensions (viral potential, hook strength, trend alignment, competition).
2. **Manually Idea Add** — add ideas manually by pasting a YouTube URL or describing a concept in an AI chatbox; the latter generates a full idea with editable title, hook, description and tags.
3. **Script** — one click generates a full hook/body/CTA script with SEO title, description, hashtags and a music suggestion.
4. **Voice** — ElevenLabs TTS renders a studio-quality voiceover from the script.
5. **Video** — a separate Remotion worker fetches stock footage from Pexels, assembles scenes to match the narration, adds word-level captions synced via Whisper, and mixes background music.
6. **Review** — approve or request changes before publishing.
7. **Publish** — schedule or upload immediately to YouTube via OAuth; metrics are pulled back after publishing for a performance feedback loop.

---

## Tech stack

| Layer | Technology |
|---|---|
| **Dashboard** | Next.js 15 (App Router), React 19, TypeScript |
| **UI** | Tailwind CSS v4, shadcn/ui (New York), Sonner toasts |
| **Database** | Supabase (Postgres + Realtime + Storage) |
| **Queue** | pgmq (Postgres message queue extension) |
| **AI** | Vercel AI SDK → OpenAI GPT-4o-mini |
| **Voice** | ElevenLabs TTS |
| **Video** | Remotion 4 + FFmpeg |
| **Captions** | Whisper (word-level timestamps via verbose_json) |
| **Stock footage** | Pexels API |
| **Publishing** | YouTube Data API v3 (OAuth 2.0) |

---

## Repository structure

```
yt-shorts-ai/
├── app/
│   ├── dashboard/          # Main pipeline dashboard (server component + IdeaList)
│   └── settings/           # Global settings, search queries, music library
│   └── api/                # API routes for Youtube OAuth callback
├── components/
│   ├── IdeaCard.tsx         # Expandable idea card with inline actions + stage navigation
│   ├── IdeaList.tsx         # List with multi-select bulk actions
│   ├── ActionButtons.tsx    # Status-specific action buttons
│   ├── AddIdeaPanel.tsx     # Manual idea input (YouTube URL or AI chatbox)
│   ├── IdeaChatbox.tsx      # AI-powered idea generator with editable preview
│   ├── PipelineNav.tsx      # Stage tab navigation
│   ├── StageProgress.tsx    # Live render progress (Supabase Realtime)
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── actions/
│   │   ├── discover.ts      # YouTube scraping + batch AI scoring
│   │   ├── script.ts        # Approve / reject / restore / retry
│   │   ├── production.ts    # ElevenLabs voiceover, video render queue
│   │   ├── publish.ts       # YouTube OAuth upload + scheduling
│   │   ├── batch.ts         # Bulk approve / reject / restore / retry
│   │   ├── manual-idea.ts   # Add idea from URL or AI prompt
│   │   ├── performance.ts   # YouTube Analytics metrics refresh
│   │   └── settings.ts      # Global config, search queries, music tracks
│   ├── ai.ts               # Vercel AI SDK wrappers (score, script, SEO, prompt→idea)
│   ├── supabase.ts         # DB client + typed query helpers
│   ├── queue.ts            # pgmq enqueue helpers
│   └── youtube-scraper.ts  # YouTube Data API v3 scraper
├── worker/
│   ├── index.ts            # Poll loop (every 3 s)
│   ├── video-pipeline.ts   # Orchestrator (checkpoints A+B for retries)
│   ├── scene-planner.ts    # AI breaks script into scenes with visual queries
│   ├── pexels.ts           # Stock clip fetcher
│   ├── captions.ts         # Whisper SRT parser → word timestamps
│   ├── renderer.ts         # Remotion render call
│   ├── compressor.ts       # FFmpeg post-compression
│   ├── clip-server.ts      # Local HTTP server serving clips during render
│   └── video/
│       └── Composition.tsx  # Remotion composition (scenes + captions)
├── constants/index.ts      # STAGE_GROUPS pipeline definition
└── types/index.ts          # Idea model, IdeaStatus union, niche/voice enums
```

---

## Pipeline status flow

```
discovered ───┐
scored ───────┴─→ approved → scripted → generating_voice ─┐
                                      └→ generating_video → adding_captions → produced
                                                                             ├→ ready_to_publish ──┐
                                                                             └→ changes_requested  ├→ scheduled ──→ uploading → published
                                                                                                   └─────────────┘

Any stage → failed  →  retry from last checkpoint
rejected            →  restore → scored
```

---

## Dashboard features

### Pipeline stages

The dashboard organises all ideas into six stages accessible via the top nav:

| # | Stage | Statuses |
|---|---|---|
| 01 | Discover | `discovered`, `scored` |
| 02 | Script | `approved`, `scripted` |
| 03 | Produce | `generating_voice`, `generating_video`, `adding_captions`, `produced` |
| 04 | Review | `changes_requested`, `ready_to_publish` |
| 05 | Publish | `scheduled`, `uploading`, `published` |
| — | Archive | `rejected`, `failed` |

### Multi-select bulk actions

Click **Select multiple** above the idea list to enter selection mode. Checkboxes appear on each card. Select any number and apply batch operations from the floating action bar:

- **Approve & Script** — runs AI script generation for all selected (sequential, rate-limit safe)
- **Reject** — moves all selected to Archive
- **Restore** — moves rejected ideas back to Discover
- **Retry** — re-runs each failed idea from its last successful checkpoint

### Manual idea input

The **Add Idea Manually** panel in the header offers two ways to inject ideas outside of automated discovery:

- **YouTube URL** — paste any Shorts URL; metadata is fetched from the YouTube API and AI-scored automatically, deduplicated by video ID
- **Describe Idea** — type a freeform concept into the AI chatbox, optionally pick a niche, preview and inline-edit the generated idea (title, hook, description, tags) before adding it to the pipeline, deduplicated by content hash

### Live render progress

The Produce stage shows real-time render progress (scene planning → clip fetching → Remotion render → compression) driven by Supabase Realtime subscriptions with no polling.

### Performance tracking

Published videos display live YouTube metrics (views, likes, comments, engagement rate) with a 5-tier performance tag: 🚀 viral · 📈 growing · 😐 average · ⚠ low · 💀 dead.

---

## Worker — video pipeline

The worker polls the pgmq queue every 3 seconds. Each render job runs through:

1. **Scene planner** — GPT-4o-mini breaks the script into scenes with Pexels visual search queries
2. **Pexels** — fetches and downloads the best-matching stock clip per scene
3. **Remotion** — renders the composition (video clips + sentence-aware captions)
4. **Whisper** — generates word-level timestamps for caption sync
5. **FFmpeg** — post-compresses the output for YouTube

Checkpoint-based progress (`scenes_status`: `none → planned → clips_ready → rendered`) means a crashed job resumes from where it left off rather than restarting from scratch.

### Captions

Captions are grouped into sentence-aware chunks — never crossing sentence boundaries, max 5 words per group — using Whisper `verbose_json` word-level timestamps. Render duration is derived from the last Whisper timestamp rather than the AI script estimate, preventing early video cutoff.

### Local clip server

During rendering, Remotion fetches stock clips from a local Express server which proxies requests to the Pexels API and serves the downloaded files. This avoids Remotion timeouts on large video files and allows for on-the-fly retries if a clip fails to download.
