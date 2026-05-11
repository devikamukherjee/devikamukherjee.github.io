# Devika Mukherjee — Portfolio

Personal portfolio website hosted at **https://devikamukherjee.github.io**.

## Two things you still need to add

Two asset files are referenced by the site but aren't bundled in this folder yet:

1. **`assets/resume.pdf`** — your CV. Copy your existing `Devika Mukherjee HCI.pdf` into the `assets/` folder and rename it to `resume.pdf`. The "Download CV" buttons across the site link here.
2. **`assets/profile.jpg`** — a photo of you for the hero section. Square or near-square crop works best (it's displayed as a circle, ~300×300 px). If the file is missing the site automatically falls back to a stylised "D" monogram, so the site still works without it.

That's it — no build step, no dependencies.

## Publishing to GitHub Pages

1. On GitHub, create a new repository named exactly **`devikamukherjee.github.io`** (it must match your GitHub username).
2. From this folder, in a terminal:
   ```bash
   git init
   git add .
   git commit -m "Initial portfolio site"
   git branch -M main
   git remote add origin https://github.com/devikamukherjee/devikamukherjee.github.io.git
   git push -u origin main
   ```
3. In the repo's Settings → Pages, confirm the source is **Deploy from a branch · main · /(root)**. The site goes live at `https://devikamukherjee.github.io` within a minute or two.

## File layout

```
.
├── index.html              # main portfolio
├── projects/
│   ├── better-diet.html    # Better Diet UX case study
│   ├── glucometer.html     # Glucometer SLR case study
│   └── ai-bias.html        # placeholder, awaiting full case study
├── assets/
│   ├── resume.pdf          # ← you add this
│   └── profile.jpg         # ← you add this (optional)
├── .nojekyll               # tells GitHub Pages to skip Jekyll
└── README.md
```

## Updating the AI Bias page later

When you have the full `bias.html` ready, replace the body content inside `projects/ai-bias.html` between the `<header class="hero">…</header>` and the `<footer>…</footer>` — or just overwrite the whole file, keeping the same cream/sage CSS so it matches the rest of the site.

## Editing tips

- All four pages share the same colour palette and font stack — change the `:root` CSS variables at the top of each file in lockstep if you want to tweak the theme.
- The "Belt and Whistles" publication card is the visual centre of `index.html` (section `#publications`). Keep it prominent.
- Project cards on the main page link out with `target="_blank"`, opening case studies in a new tab so visitors don't lose their place.
