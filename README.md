# Portfolio (formal edition)

Static site: plain HTML, CSS and JavaScript. No build step.

## View it

Open `index.html` in a browser, or serve the folder:

    python -m http.server 4173

then visit http://localhost:4173

## How the GitHub section stays current

- In the browser, `js/main.js` reads `api.github.com/users/anascherif/repos` on every
  page load, so a new public repository appears without touching the site.
- `data/repos.js` is a saved snapshot shown for the first instant and used as a
  fallback when GitHub is unreachable. Refresh it with `node tools/sync-repos.mjs`.
- `.github/workflows/deploy.yml` refreshes that snapshot every six hours and
  deploys to GitHub Pages. To use it: push this folder to a repository, then in
  Settings > Pages choose "GitHub Actions" as the source.

## Editing

- Text and sections: edit `tools/page.src.html`, then run `python tools/build_page.py`.
  That writes `index.html` with the vector logo inlined. Do not edit `index.html` by hand.
- Colours, type and layout: `css/style.css` (tokens at the top)
- Animation and behaviour: `js/main.js`
- Portrait: replace `tools/portrait-src.png`, run `python tools/process_portrait.py`
  (needs `pip install rembg pillow numpy opencv-python`), then
  `python tools/build_assets.py portrait` to rebuild the extended cut-out, the
  blurred backdrop and the avatar.
- Project screenshots: `assets/work/`. `tools/build_assets.py shots` rebuilds them
  from source images in `tools/raw/` (not committed).
- CV: replace `assets/Anas_Abdelmalek_Cherif_CV.pdf`
