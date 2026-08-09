# Musin landing site

Static marketing site for **Musin** — a music promotion platform that connects
music with the content creators who post it.

No build step. Every page is plain HTML with shared CSS and JS.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home — the default entry point |
| `content.html` | For Content Creators |
| `music.html` | For Music Artists |
| `features.html` | What the platform does |
| `vision.html` | Why Musin exists |
| `terms.html` | Terms and Conditions |
| `privacy.html` | Privacy Policy |
| `cookies.html` | Cookie Policy |
| `404.html` | Not-found page |

## Assets

- `assets/css/content.css` — shared shell: nav, buttons, sections, cards, footer, support dialog
- `assets/css/home.css`, `music.css` — page-specific styles
- `assets/css/page.css` — the document pages
- `assets/js/nav.js`, `cta.js`, `support.js` — shared behaviour
- `assets/js/home.js`, `content.js`, `music.js` — per-landing behaviour

Cache busting is a `?v=N` query on every CSS/JS link. **Bump it when you edit
one of those files**, or returning visitors keep the old copy.

## Deploying

GitHub Pages serves this directly from the repository root. `.nojekyll` stops
Pages from running the files through Jekyll.

## Before going live

Some values in the legal pages are still placeholders from the source
documents. They render as red dashed chips so they are impossible to miss —
search for `class="todo"` to list them.
