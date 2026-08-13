# Musin landing site

Static marketing site for **Musin** — a music promotion platform that connects
music with the content creators who post it.

No build step. Every page is plain HTML with shared CSS and JS.

## Pages

Each page is a directory with an `index.html`, so the URLs are extensionless.

| URL | File |
| --- | --- |
| `/` | `index.html` — Home, the default entry point |
| `/content` | `content/index.html` — For Content Creators |
| `/music` | `music/index.html` — For Music Artists |
| `/features` | `features/index.html` |
| `/vision` | `vision/index.html` |
| `/legal` | `legal/index.html` — hub linking the four legal documents |
| `/terms` | `terms/index.html` |
| `/privacy` | `privacy/index.html` — also holds `#impressum` and `#data-deletion` |
| `/cookies` | `cookies/index.html` |
| `/home` | `home/index.html` — alias, redirects to `/` |
| — | `404.html` — not-found page |

Internal links are root-absolute (`/content`, not `content.html`), so they
resolve the same from any depth.

## Assets

Everything the landing needs lives under `landing-assets/`, referenced with
root-absolute URLs (`/landing-assets/...`). The namespace keeps these files
clear of anything else served from the same domain.

- `/landing-assets/css/content.css` — shared shell: nav, buttons, sections, cards, footer, support dialog
- `/landing-assets/css/home.css`, `music.css` — page-specific styles
- `/landing-assets/css/page.css` — the document pages
- `/landing-assets/js/nav.js`, `cta.js`, `support.js` — shared behaviour
- `/landing-assets/js/home.js`, `content.js`, `music.js` — per-landing behaviour

Cache busting is a `?v=N` query on every CSS/JS link. **Bump it when you edit
one of those files**, or returning visitors keep the old copy.

## Deploying

GitHub Pages serves this directly from the repository root. `.nojekyll` stops
Pages from running the files through Jekyll.

## Before going live

Some values in the legal pages are still placeholders from the source
documents. They render as red dashed chips so they are impossible to miss —
search for `class="todo"` to list them.
