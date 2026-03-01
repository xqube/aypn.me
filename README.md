# aypn.me

![Node](https://img.shields.io/badge/node-%3E%3D24-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Tests](https://img.shields.io/badge/tests-5%20passing-brightgreen)

A high-performance, server-rendered technical blog built with **Node.js**, **Express**, **EJS**, and **Tailwind CSS**. Posts are authored in MDX, compiled through a custom unified pipeline, and served from pre-built JSON artifacts with ~30ms cold startup.

---

## Features

- **Zero-DB Architecture** — Entirely file-system and memory-based. No database required.
- **3-Phase Separation** — Clean author → build → serve pipeline with no phase coupling.
- **Incremental Builds** — SHA-256 content hashing skips unchanged posts. Typical no-op build: <1s.
- **Content HMR** — Dev mode watches `.mdx` files and hot-swaps only the changed post in-memory.
- **ETag Caching** — MD5-based weak ETags on blog routes with `304 Not Modified` support.
- **SEO & Syndication** — Auto-generated `/sitemap.xml` and `/rss` (Atom feed), built from cache with zero external dependencies.
- **Security** — `helmet` with CSP/HSTS, path-traversal protection on asset routes, `rel="noopener noreferrer"` on external links.
- **Structured Logging** — `winston` (JSON in prod, colorized in dev) with rotating error log files. HTTP requests piped through `morgan` → `winston`.
- **CI/CD** — GitHub Actions runs tests on every PR and auto-deploys to VPS on `main` push.
- **Route Tests** — Smoke tests with `vitest` + `supertest` covering all critical endpoints.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Author Time                            │
│  content/posts/YYYY-MM-DD/post-slug/                        │
│    ├── index.mdx            (frontmatter + markdown)        │
│    └── thumbnail.png        (colocated assets)              │
└──────────────────────┬──────────────────────────────────────┘
                       │
            npm run build:content
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Build Time                             │
│  scripts/build-content.js                                   │
│    ├── SHA-256 content hashing (incremental builds)         │
│    ├── 10-stage unified/remark/rehype MDX pipeline          │
│    ├── Per-post JSON artifacts: dist/posts/{slug}.json      │
│    ├── Atomic writes (.tmp → rename)                        │
│    └── Client-side search index: public/search-index.json   │
└──────────────────────┬──────────────────────────────────────┘
                       │
             npm run dev / npm start
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Runtime                                │
│  server.js → cache.js loads dist/posts/*.json (~30ms)       │
│    ├── Pre-computed indexes (sorted, trending, tags)        │
│    ├── EJS server-side rendering with ETag caching          │
│    ├── Winston structured logging + morgan HTTP logs        │
│    ├── /sitemap.xml + /rss (Atom feed)                      │
│    └── chokidar HMR watcher (dev mode only)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 24.0.0
- **npm** (bundled with Node)

### Installation

```bash
git clone <your-repo-url> && cd blog.aypn

# Install all dependencies
npm install

# Build content artifacts + Tailwind CSS
npm run build

# Start development server with HMR
npm run dev
# → http://localhost:3001
```

---

## Project Structure

```
blog.aypn/
├── server.js                    # Entry point — boots cache, starts Express
├── app.js                       # Express app — middleware, routes (exported for tests)
├── src/
│   ├── config.js                # Centralized environment config (single process.env reader)
│   ├── logger.js                # Winston logger (JSON prod / colorized dev)
│   ├── content/
│   │   ├── pipeline.js          # MDX → HTML (unified/remark/rehype, 10 stages)
│   │   ├── cache.js             # In-memory store, pre-computed indexes, HMR watcher
│   │   └── search.js            # Client-side search index generator
│   └── routes/
│       ├── index.js             # Homepage (/, projects, resume, blog preview)
│       ├── blog.js              # Blog routes (/blog, /blog/:slug) with ETag caching
│       └── feed.js              # /sitemap.xml + /rss (Atom feed)
├── tests/
│   └── routes.test.js           # Vitest + supertest route smoke tests
├── scripts/
│   └── build-content.js         # MDX → dist/posts/*.json (incremental, SHA-256)
├── content/
│   ├── posts/                   # MDX posts organized by date
│   │   └── YYYY-MM-DD/
│   │       └── post-slug/
│   │           ├── index.mdx    # Post content with YAML frontmatter
│   │           └── *.png/jpg    # Colocated images (auto-rewritten to /blog/slug/*)
│   ├── projects.js              # Portfolio project data
│   └── resume.js                # Resume/experience data
├── views/
│   ├── index.ejs                # Homepage template
│   ├── blog.ejs                 # Blog listing with pagination
│   ├── post.ejs                 # Single post with TOC sidebar
│   ├── 404.ejs                  # Not found page
│   └── partials/                # head, header, sidebar, footer
├── dist/                        # Build artifacts (gitignored)
├── logs/                        # Winston error logs in production (gitignored)
├── public/
│   ├── css/styles.css           # Compiled Tailwind CSS
│   ├── img/                     # Static images
│   └── search-index.json        # Client-side search data
├── theme.config.js              # Design tokens (light/dark palettes, syntax colors)
├── tailwind.config.js           # Tailwind config with CSS variable mapping
├── input.css                    # Tailwind directives, prose styles, Prism overrides
├── ecosystem.config.js          # PM2 process manager config
├── Dockerfile                   # Multi-stage Docker build (node:24-alpine)
├── nginx/blog.conf              # Nginx reverse proxy + static asset config
└── .github/workflows/deploy.yml # CI/CD: test on PR, auto-deploy on push
```

---

## Writing Content

### Post Structure

Create a new post by adding a directory under `content/posts/`:

```
content/posts/2026-03-01/my-new-post/
├── index.mdx          # Post content
└── thumbnail.png      # Optional cover image (colocated)
```

### Frontmatter Schema

```yaml
---
title: "Post Title"
description: "Meta description for SEO."
date: "2026-03-01T10:00:00.000Z"     # ISO 8601
tags: ["javascript", "performance"]   # Array of tag strings
slug: "my-new-post"                   # URL-safe identifier
coverImage: "./thumbnail.png"         # Optional, relative path
---
```

| Field | Required | Notes |
|-------|:--------:|-------|
| `title` | ✅ | Post heading and `<title>` tag |
| `description` | ✅ | SEO meta description |
| `date` | ✅ | ISO 8601 — determines sort order |
| `tags` | ✅ | Array of strings for categorization |
| `slug` | ✅ | URL path: `/blog/{slug}` |
| `coverImage` | ❌ | Validated at compile time — set to `null` if file missing |

### MDX Pipeline

Each post is processed through a **10-stage unified pipeline**:

1. `gray-matter` → Extract YAML frontmatter
2. `remark-parse` → Parse Markdown to MDAST
3. `remark-gfm` → GitHub Flavored Markdown (tables, strikethrough)
4. `remark-rehype` → Transform MDAST to HAST
5. `rehype-raw` → Pass through raw HTML (for embeds)
6. `rehypeCallouts` → GitHub-style callout blocks (`[!NOTE]`, `[!WARNING]`, etc.)
7. `rehypeRewriteImages` → Rewrite `./image.png` → `/blog/slug/image.png`
8. `rehypeExtractToc` → Extract h2/h3 headings, inject anchor IDs, build TOC
9. `rehypeExternalLinks` → Add `target="_blank"`, `rel="noopener noreferrer"`
10. `rehype-prism-plus` → Syntax highlighting via Prism

---

## Commands & Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development server with content HMR and colorized logging |
| `npm start` | Build content + start production server |
| `npm run build` | Build content artifacts + compile Tailwind CSS |
| `npm run build:content` | MDX → JSON (incremental, SHA-256 hashed) |
| `npm run build:content:force` | MDX → JSON (full rebuild, ignores manifest) |
| `npm run build:css` | Tailwind CSS compilation and minification |
| `npm test` | Run route smoke tests via Vitest |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server listening port |
| `NODE_ENV` | — | `development` or `production` |
| `SITE_URL` | `http://localhost:3001` | Canonical URL for SEO, sitemap, and RSS |

All environment access is centralized in `src/config.js`. No other file reads `process.env` directly.

---

## Testing & CI/CD

### Tests

Route smoke tests live in `tests/routes.test.js` using **Vitest** + **supertest**:

```bash
npm test
```

| Test | Assertion |
|------|-----------|
| `GET /` | 200, contains `<title>` |
| `GET /blog` | 200, contains `Posts` |
| `GET /blog/nonexistent` | 404 |
| `GET /sitemap.xml` | 200, valid XML |
| `GET /rss` | 200, valid Atom feed |

### CI/CD

The GitHub Actions workflow (`.github/workflows/deploy.yml`) runs two jobs:

1. **Test** — on every push and PR to `main`: checkout → Node 24 → `npm ci` → `npm run build:content` → `npm test`
2. **Deploy** — on push to `main` only (after tests pass): SSH into VPS and run `deploy.sh`

**Required GitHub Secrets:**

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | Server IP or hostname |
| `VPS_USER` | SSH username |
| `VPS_SSH_KEY` | Private SSH key |

---

## Deployment

### PM2 (Recommended)

```bash
npm run build
pm2 start ecosystem.config.js
pm2 save
```

### Docker

```bash
docker build -t aypn-blog .
docker run -p 3001:3001 aypn-blog
```

### When to Rebuild

| Scenario | Command |
|----------|---------|
| Code change (route, template) | `pm2 restart aypn.me` |
| New or edited blog post | `npm run build:content && pm2 restart aypn.me` |
| CSS or theme change | `npm run build:css && pm2 restart aypn.me` |
| New post + CSS change | `npm run build && pm2 restart aypn.me` |

---

## Performance

| Metric | Value |
|--------|-------|
| Server startup (from artifacts) | ~30ms |
| Full content build (8 posts) | ~1.5s |
| Incremental build (0 changes) | <600ms |
| Single post recompile (HMR) | ~150ms |

---

## Logging

| Environment | Transport | Format |
|-------------|-----------|--------|
| Development | Console | Colorized, human-readable with timestamps |
| Production | Console + File | JSON to stdout (PM2 captures) + `logs/error.log` (5MB × 3 rotating) |

HTTP request logs (`morgan`) are piped through Winston for a unified logging pipeline.

---

## License

MIT
