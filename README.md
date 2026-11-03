# Devika Mukherjee — Portfolio

Personal portfolio hosted at **https://devikamukherjee.github.io**. No build step, no dependencies.

## Layout

```
index.html              # single-page site: hero, about, research threads, publication, work, projects, education, contact
assets/css/site.css     # all styling (full-bleed sections, motion, demo widgets)
assets/js/ink.js        # suminagashi ink — hero only
assets/js/site.js       # nav, scroll progress, reveal-on-scroll, counters, timeline, cursor
assets/js/widgets.js    # interactive demos: haptic belt, alert budget, mini VAA, theme coder, verification space, pressure pad
assets/resume.pdf       # CV linked from the nav and contact section
projects/*.html         # earlier case studies (Better Diet, Glucometer SLR, AI Bias)
```

## Editing

- Work history and project text live directly in `index.html`; each job is an `<article class="job">`, each featured project an `<article class="project">`.
- Colours and fonts are CSS variables at the top of `assets/css/site.css`.
- The Signal or Noise card links to the Streamlit app URL; update the `href` in `index.html` if the app moves.
- Replace `assets/resume.pdf` to update the downloadable CV.

## Publishing

Push to `main`; GitHub Pages serves the root of the branch.
