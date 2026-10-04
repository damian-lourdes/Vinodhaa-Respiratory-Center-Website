# Vinodhaa Respiratory Centre — Website

Static site for Vinodhaa Respiratory Centre (Dr. Dhanasekar), Anna Nagar East, Chennai.

## File structure

```
.
├── index.html        Markup
├── css/
│   └── styles.css    All styles
├── js/
│   └── script.js      All interactive behavior (theme toggle, marquee,
│                       FAQ chat widget, booking modal + mini calendar,
│                       mobile menu, scroll reveal)
├── package.json       Runs the site locally/on Railway via `serve`
└── README.md
```

Note: a small inline `<script>` stays directly in `index.html`'s `<head>`
(theme restore, reads `localStorage`) — it has to run before first paint to
avoid a flash of the wrong light/dark theme, so it's not in `js/script.js`.

## Run locally

```
npx serve -s .
```

## Deploy

Push this folder to a GitHub repo and deploy it on Railway ("Deploy from
GitHub repo") — it detects `package.json` and runs `serve` automatically.
