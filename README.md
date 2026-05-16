# Emelio Exaudi Portfolio v7

A bold, animated, single-page portfolio targeting data analyst and data engineer roles. Dark theme, gradient accents, full motion design (scroll reveals, custom cursor, magnetic buttons, parallax, count-up KPIs, real interactive data visualizations).

## What this is

- One-page site, three source files, no build step
- Dark theme inspired by Linear / Framer / Apple product pages
- Hero with animated particle canvas and gradient glow drift
- Marquee skill ticker
- 6 case study cards in a 12-column bento grid (different sizes per card)
- Real interactive data visualization section with 3 switchable charts (bias correction, risk matrix, CMIP6 projection) — built from real-looking sample data
- Skills matrix with animated proficiency pips
- About section with tilting info cards
- Contact cards with hover animations
- Full case study modal with embedded showcase grid
- Mobile responsive (cursor disabled on touch, layouts collapse cleanly)
- Print-friendly (animations and chrome stripped for clean PDF print)

## File structure

```
portfolio/
  index.html                  Page structure and meta tags
  styles.css                  All visual styling and animations
  script.js                   Loader, animations, charts, modal logic
  data.json                   All content (edit this for 95% of changes)
  Emelio_Exaudi_Resume.pdf    Linked from "Resume" button
  assets/
    profile.jpg               Your headshot (currently placeholder)
    showcase/                 Drop project screenshots here
      README.md               Naming convention notes
  README.md                   This file
```

---

## How to update content

You'll edit **only two things** for almost all changes: `data.json` and the `assets/showcase/` folder.

### 1. Replace the profile photo

Current `assets/profile.jpg` is a placeholder silhouette. Replace with your actual headshot.

- Path: `assets/profile.jpg`
- Recommended: 800 × 1000 px, JPG, well-lit, neutral background
- Keep the filename OR update `profile.photo` in `data.json`

Note: v7 design does not currently display a portrait in the hero (the visual focus is the headline + animation). The photo is used inside the case study modals for projects that show personal photos in their `showcase` array.

### 2. Add project screenshots

Every case study card has a placeholder that reads **"ADD IMAGE · DATA.JSON · ACHIEVEMENTS[0].SHOWCASE[0].IMAGE"**. Here's how to fill them:

**Step A.** Save screenshots into `assets/showcase/`. Suggested filenames:

```
assets/showcase/
  ecos-risk-heatmap.png
  antam-bias-correction.png
  antam-dashboard-overview.png
  bmkg-cmip6-downscaling.png
  atmosphaira-awlr-deployment.jpg
  ieeebig-final-stage.jpg
```

**Step B.** Open `data.json`. Each project is in the `achievements` array. Each has a `showcase` array. Each showcase tile has an `image` field currently empty (`""`). Fill the path:

```json
"showcase": [
  {
    "label": "12-Factor Risk Heatmap",
    "type": "diagram",
    "caption": "Probability vs impact axes, color-coded by severity",
    "image": "assets/showcase/ecos-risk-heatmap.png"
  }
]
```

**The first showcase tile with an `image` automatically becomes the card thumbnail** on the main grid. Put your strongest visual in `showcase[0]` for each project.

### 3. Add project documentation or GitHub links

Each project has a `link` field that's empty (`""`). When you finish a project repo, Notion doc, Medium article, or video walkthrough, paste the URL:

```json
{
  "id": "antam-2025",
  "title": "HSSE Data Analyst Intern",
  "link": "https://github.com/your-username/antam-rainfall-bias-correction",
  ...
}
```

When `link` is empty, the case study modal shows a small placeholder reminder. When filled, it becomes a prominent **"View project documentation →"** button.

### 4. Edit headline, summary, contact info

Open `data.json`. The `profile` object controls:

```json
{
  "profile": {
    "name": "...",
    "photo": "assets/profile.jpg",
    "email": "...",
    "phone": "...",
    "linkedin": "...",
    "github": "",
    "tagline": "...",
    "summary": "..."
  }
}
```

The hero headline ("Turning noisy environmental data into business decisions.") is hardcoded in `index.html`. To change it, search for `class="hero-title"` and edit the three `<span class="ht-line">` blocks. The third line uses gradient italic — keep it the visual punchline.

### 5. Adjust skill proficiency levels

Open `script.js`. Near the top, the `SKILL_LEVELS` map controls how many pips light up per skill:

```js
const SKILL_LEVELS = {
  'Python':     3,    // 3 = Advanced
  'SQL':        2,    // 2 = Proficient
  'R':          1,    // 1 = Working
  ...
};
```

Edit the numbers to match how you describe yourself.

### 6. Customize the data visualization section

The "Signature Visualization" section currently uses **sample data** for three charts:

- **Bias Correction** — fake but plausible rainfall series (Raw GPM, Corrected, Ground gauge)
- **12-Factor Risk Matrix** — placeholder probability × impact heatmap
- **CMIP6 Projection** — fake temperature anomaly time series

When you have real numbers from your ECOS or ANTAM work, open `script.js` and search for `VIZ_DATA`. Replace the arrays with your real data. The chart code auto-scales axes, so you only need to swap values.

The caption underneath (Method / Data source / Outcome) updates from text fields in the same `VIZ_DATA` block.

### 7. Add or remove a project

In `data.json`, the `achievements` array is rendered top to bottom. To reorder, move items. To add new:

```json
{
  "id": "new-project-2026",
  "year": "2026",
  "type": "Internship",
  "title": "Project Title",
  "org": "Company Name",
  "period": "Mar 2026 to May 2026",
  "role": "Data Analyst",
  "description": "One-sentence outcome statement.",
  "tags": ["Python", "SQL", "Tableau"],
  "fullDescription": [
    "Paragraph 1.",
    "Paragraph 2."
  ],
  "highlights": [
    "Quantified outcome 1",
    "Quantified outcome 2"
  ],
  "showcase": [
    {
      "label": "Dashboard Overview",
      "type": "diagram",
      "caption": "What this image shows",
      "image": "assets/showcase/your-screenshot.png"
    }
  ],
  "link": "https://github.com/your-repo"
}
```

The work grid uses a bento layout with cards of different widths. With 6 cards the layout is: 7-5, 5-7, 6-6. With more or fewer cards the grid adjusts automatically.

### 8. Replace resume PDF

Drop your latest resume in the root folder named exactly `Emelio_Exaudi_Resume.pdf`.

---

## Animations included

All these are already wired up — they activate automatically:

- **Loader** — gradient bar fills on page load, fades out
- **Custom cursor** — dot + ring, grows on hover, color shifts
- **Scroll progress bar** — top of page, gradient fill tracking scroll position
- **Particle canvas** — slow-drifting dots in hero background
- **Gradient glow drift** — two large blurred orbs slowly orbit the hero
- **Scroll reveal** — sections fade up as they enter viewport
- **Line reveal** — section titles animate in line-by-line (overflow + translateY)
- **Count-up numbers** — KPI strip animates from 0 to value when in view
- **Magnetic buttons** — buttons subtly follow cursor on hover
- **Tilt cards** — about info cards tilt slightly toward cursor
- **Marquee** — skill ticker scrolls infinitely, pauses on hover
- **Animated charts** — three chart types in the viz section, switchable, with hover tooltips
- **Skill pips** — proficiency bars animate in with staggered delay
- **Modal entrance** — modal scales up with backdrop blur on open
- **Contact card hover** — icon rotates, arrow shoots out

To turn off any specific animation, edit `styles.css` and either remove the `@keyframes` block or set the relevant `transition` to `none`.

---

## Deploy

Pure static site. Pick one:

**Vercel (recommended)**

1. Sign up at vercel.com with GitHub
2. Push this folder to a GitHub repo
3. Vercel → "Add New Project" → select repo → deploy. URL: `emelio-portfolio.vercel.app`.

**Netlify**

1. Sign up at netlify.com
2. Drag folder onto upload zone
3. URL: `emelio-portfolio.netlify.app`

**GitHub Pages**

1. Push to public repo, enable Pages in Settings
2. Lives at `your-username.github.io/repo-name/`

Once deployed, put the URL on your resume, LinkedIn About, and email signature.

---

## Browser support

- Chromium (Chrome, Edge, Brave, Arc): full support
- Safari 16+: full support
- Firefox: full support except `backdrop-filter` may have slight visual differences
- Mobile (iOS Safari, Chrome Android): custom cursor disabled, all other animations preserved with touch-friendly fallbacks

If you find a recruiter using IE11, that's a separate conversation.

---

## Performance notes

- Total page weight: ~50 KB CSS + ~30 KB JS + your images
- No external JavaScript dependencies. No build step. No npm.
- Fonts loaded from Google Fonts CDN
- All animations use CSS transforms / opacity (GPU-accelerated)
- Canvas particle count auto-adjusts based on viewport size
