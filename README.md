# aypn.me

A minimal, server-rendered technical blog built with Node.js, Express, EJS, and Tailwind CSS. Posts are authored in MDX with colocated assets, compiled through a unified remark/rehype pipeline, and served from pre-built JSON artifacts for near-instant startup.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                   Author Time                          │
│  content/posts/YYYY-MM-DD/post-name/                   │
│    ├── index.mdx          (frontmatter + markdown)     │
│    └── thumbnail.png      (colocated assets)           │
└──────────────────────┬─────────────────────────────────┘
                       │
            npm run build:content
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│                   Build Time                           │
│  scripts/build-content.js                              │
│    ├── SHA-256 content hashing (incremental builds)    │
│    ├── Batched concurrent MDX compilation              │
│    ├── Per-post JSON: dist/posts/{slug}.json           │
│    └── Manifest: dist/manifest.json                    │
└──────────────────────┬─────────────────────────────────┘
                       │
              npm run dev / npm start
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│                   Runtime                              │
│  app.js → cache.js loads dist/posts/*.json (~30ms)     │
│    ├── Pre-computed indexes (sorted, trending, tags)   │
│    ├── EJS server-side rendering                       │
│    ├── Static asset serving for colocated images       │
│    └── chokidar HMR watcher (dev mode only)            │
└────────────────────────────────────────────────────────┘
```

The application separates concerns into three distinct phases: authoring (MDX), building (compilation to HTML), and serving (Express + EJS). The build step produces self-contained JSON artifacts that the runtime loads without recompilation.

---

## Folder Structure

```
blog.aypn/
├── app.js                      # Express entry point, middleware, route mounting
├── src/
│   ├── config.js               # Centralized environment configuration
│   ├── content/
│   │   ├── pipeline.js         # MDX → HTML compilation (unified/remark/rehype)
│   │   ├── cache.js            # In-memory store, pre-computed indexes, HMR watcher
│   │   └── search.js           # Client-side search index generator
│   └── routes/
│       ├── index.js            # Homepage route (/, projects, resume, blog preview)
│       └── blog.js             # Blog routes (/blog, /blog/:slug, asset serving)
├── scripts/
│   └── build-content.js        # Pre-build script: MDX → dist/posts/*.json
├── content/
│   ├── posts/                  # MDX posts organized by date
│   │   └── YYYY-MM-DD/
│   │       └── post-name/
│   │           ├── index.mdx   # Post content with frontmatter
│   │           └── *.png/jpg   # Colocated images
│   ├── projects.js             # Portfolio project data
│   └── resume.js               # Resume/experience data
├── views/
│   ├── index.ejs               # Homepage template
│   ├── blog.ejs                # Blog listing with pagination
│   ├── post.ejs                # Single post view with TOC
│   ├── 404.ejs                 # Not found page
│   └── partials/
│       ├── head.ejs            # <head> meta tags, SEO
│       ├── header.ejs          # Navigation bar
│       ├── sidebar.ejs         # Latest & Trending sidebars
│       └── footer.ejs          # Site footer
├── dist/                       # Build artifacts (gitignored)
│   ├── posts/                  # Per-post compiled JSON files
│   └── manifest.json           # Content hashes for incremental builds
├── public/
│   ├── css/styles.css          # Compiled Tailwind CSS
│   ├── img/                    # Static images
│   └── search-index.json       # Client-side search data
├── theme.config.js             # Design tokens (light/dark palettes, syntax colors, fonts)
├── tailwind.config.js          # Tailwind config with semantic CSS variable mapping
├── input.css                   # Tailwind directives, prose styles, Prism overrides
├── ecosystem.config.js         # PM2 process manager configuration
├── Dockerfile                  # Multi-stage Docker build
└── nginx/blog.conf             # Nginx reverse proxy + static asset config
```

---

## Content Pipeline

### Authoring

Posts are written as `.mdx` files inside date-organized directories:

```
content/posts/2026-02-27/async-javascript-deep-dive/
├── index.mdx
└── thumbnail.png
```

### Frontmatter Schema

```yaml
---
title: "Post Title"
description: "Meta description for SEO."
date: "2026-02-27T07:17:44.716Z"    # ISO 8601
tags: ["javascript", "async"]        # Array of tag strings
slug: "post-slug"                    # URL-safe identifier
coverImage: "./thumbnail.png"        # Optional, relative to post dir
---
```

The `coverImage` path is validated at compile time — if the referenced file does not exist on disk, `coverImage` is set to `null` and templates skip the image block entirely.

### Compilation

The unified pipeline in `src/content/pipeline.js` processes each post through:

1. **gray-matter** — Extracts YAML frontmatter from MDX source
2. **remark-parse** — Parses Markdown into MDAST
3. **remark-gfm** — Adds GitHub Flavored Markdown (tables, strikethrough, autolinks)
4. **remark-rehype** — Transforms MDAST to HAST (HTML AST)
5. **rehype-raw** — Passes through raw HTML blocks (for embeds)
6. **rehypeRewriteImages** — Rewrites relative `./image.png` paths to `/blog/slug/image.png`
7. **rehypeExtractToc** — Extracts h2/h3 headings, injects anchor IDs, builds TOC array
8. **rehypeExternalLinks** — Adds `target="_blank"`, `rel="noopener noreferrer"` to external links
9. **rehype-prism-plus** — Syntax highlights code blocks via Prism
10. **rehype-stringify** — Serializes HAST to final HTML string

ESM modules are loaded once via `ensureModules()` and reused across all compilations.

---

## Caching Strategy

### Production

```
npm start
  → scripts/build-content.js   (compile MDX → dist/posts/*.json)
  → app.js                     (load JSON artifacts into memory)
```

On startup, `cache.js` reads all `dist/posts/*.json` files into an in-memory `Map<slug, post>`. Pre-computed indexes are built once:

- **sortedPosts** — All posts sorted by date descending
- **trendingPosts** — Sorted by tag count descending
- **tagCounts** — Aggregated `{ tag: count }` object

All query methods (`getPost`, `getAllPosts`, `getLatestPosts`, `getTrendingPosts`, `getPostsByTag`) return pre-computed references in O(1).

### Development

```
npm run dev
  → app.js with NODE_ENV=development
  → Loads from dist/posts/*.json (if available) OR compiles from source
  → Starts chokidar file watcher on content/posts/**/*.mdx
```

When a `.mdx` file is added, modified, or deleted, only that single file is recompiled and the in-memory indexes are rebuilt. No full recompilation occurs.

### Incremental Builds

`scripts/build-content.js` maintains `dist/manifest.json` with SHA-256 hashes per post. On subsequent builds, unchanged files are skipped entirely. A typical incremental build with 0 changes completes in under 1 second.

---

## How to Run

### Prerequisites

- Node.js ≥ 18.0.0
- npm

### Development

```bash
# Install dependencies
npm install

# Build content artifacts (first time)
npm run build:content

# Build Tailwind CSS
npm run build:css

# Start development server with HMR
npm run dev
# → http://localhost:3001
```

### Production

```bash
# Full build (content + CSS) and start
npm start

# Or separately:
npm run build          # content + CSS
NODE_ENV=production node app.js
```

### With PM2

```bash
npm run build
pm2 start ecosystem.config.js
```

### With Docker

```bash
docker build -t aypn-blog .
docker run -p 3000:3000 aypn-blog
```

### Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Development server with file watching |
| `npm start` | Build content + start production server |
| `npm run build` | Build content artifacts + Tailwind CSS |
| `npm run build:content` | MDX → JSON (incremental) |
| `npm run build:content:force` | MDX → JSON (full rebuild, ignores cache) |
| `npm run build:css` | Tailwind CSS compilation |

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Server listening port |
| `NODE_ENV` | — | `development` or `production` |
| `SITE_URL` | `http://localhost:3001` | Canonical site URL for SEO and link generation |

All environment access is centralized in `src/config.js`. No other file reads `process.env` directly.

---

## Design System

The theme is defined in `theme.config.js` with light and dark palettes, syntax highlighting colors, and font stacks. CSS Custom Properties are set in `input.css` under `:root` (light) and `.dark` (dark), then mapped to Tailwind utility classes via `tailwind.config.js`:

```
theme.config.js  →  input.css (:root / .dark vars)  →  tailwind.config.js (semantic utilities)
```

Semantic tokens: `bg-surface`, `text-content`, `text-heading`, `text-muted`, `border-line`, `text-accent`.

All color values are WCAG AA compliant with contrast ratios documented inline.

---

## Deployment

### VPS — First-Time Setup

SSH into your VPS and run once:

```bash
cd /home/xqube/aypn.me
git clone <your-repo-url> .    # or you already have the code here
npm ci
npm run build
npm prune --omit=dev           # remove devDependencies after build
pm2 start ecosystem.config.js
pm2 save                       # saves PM2 process list so it auto-starts on reboot
```

### VPS — Updating (Every Deploy)

After pushing new posts or code changes to GitHub, SSH into your VPS:

```bash
cd /home/xqube/aypn.me
git pull
npm ci
npm run build
npm prune --omit=dev
pm2 restart aypn.me
```

Or use the included deploy script to do it all in one command:

```bash
bash ~/aypn.me/deploy.sh
```

### When to Rebuild vs Just Restart

| Scenario | Command |
|---|---|
| Code change (route, template, middleware) | `pm2 restart aypn.me` |
| New or edited blog post (`.mdx`) | `npm run build:content && pm2 restart aypn.me` |
| Changed theme/CSS (`input.css`, `theme.config.js`) | `npm run build:css && pm2 restart aypn.me` |
| New post + CSS change | `npm run build && pm2 restart aypn.me` |

### With Docker

```bash
docker build -t aypn-blog .
docker run -p 3000:3000 aypn-blog
```

### Nginx (Recommended)

An Nginx reverse proxy configuration is provided in `nginx/blog.conf`:
- Proxies to the Node.js backend on port 3000
- Serves `/css/` and `/fonts/` directly with 1-year immutable caching
- Gzip compression for text assets
- Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)

### Security

Express uses `helmet` for security headers and a Content Security Policy. The blog asset route (`/:slug/*`) includes path traversal protection — resolved paths are verified to remain inside the post directory before serving.

---

## Performance

| Metric | Value |
|---|---|
| Server startup (from artifacts) | ~30ms |
| Full content build (7 posts) | ~1.5s |
| Incremental build (0 changes) | ~0.7s |
| Single post recompile (HMR) | ~150ms |

### Optimizations

- **Gzip compression** via `compression` middleware
- **Aggressive static caching** with `max-age: 1y, immutable` for CSS and fonts in production
- **Lazy image loading** with `loading="lazy"` and `decoding="async"` on thumbnails
- **Pre-computed indexes** — no per-request filtering or sorting
- **ESM module hoisting** — unified/remark/rehype loaded once, not per-file

---

## Scaling Considerations

The current architecture handles hundreds of posts comfortably. For larger scales:

| Post Count | Recommended Action |
|---|---|
| 1–100 | Current architecture is sufficient |
| 100–500 | Increase `BATCH_SIZE` in build script |
| 500–1,000 | Add `worker_threads` for parallel compilation |
| 1,000–5,000 | Consider lazy HTML loading (per-slug on-demand) |
| 5,000+ | Move to SQLite/Redis backing store or static site generation |

### Known Limitations

- **In-memory content store** — All compiled HTML lives in process memory. Under PM2 cluster mode, each worker duplicates the full dataset.
- **No image optimization** — Thumbnails are served as-is. No `sharp` resizing or CDN integration.
- **No ISR/SSG** — Pages are rendered on every request. Adding HTTP-level caching (Varnish, Cloudflare) is recommended for high traffic.

---

## Dependencies

### Production

| Package | Purpose |
|---|---|
| `express` | HTTP server and routing |
| `ejs` | Server-side HTML templating |
| `gray-matter` | YAML frontmatter extraction |
| `unified` / `remark-*` / `rehype-*` | MDX → HTML compilation pipeline |
| `rehype-prism-plus` | Syntax highlighting for code blocks |
| `hast-util-to-string` / `unist-util-visit` | AST traversal utilities for TOC extraction |
| `helmet` | Security headers and CSP |
| `compression` | Gzip/deflate response compression |

### Development

| Package | Purpose |
|---|---|
| `tailwindcss` / `postcss` / `autoprefixer` | CSS utility framework and processing |
| `chokidar` | File system watching for dev HMR |

---

## License

MIT
