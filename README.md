# Marvin Baptista Portfolio

This repository contains a static personal portfolio website for Marvin Baptista. It has been reorganized to support scaling and deployment on GitHub Pages.

## Folder Structure

```
/
├─ docs/                # site content (GitHub Pages will serve from here)
│   ├─ index.html       # main HTML file
│   ├─ assets/
│   │   ├─ css/style.css
│   │   ├─ js/main.js    # placeholder for custom scripts
│   │   └─ img/          # static images/screenshots
├─ README.md            # this file
├─ .gitignore           # common ignores
```

## Working Locally

1. Open `docs/index.html` in your browser (the root `index.html` now redirects here automatically).
   - If you simply double-click the repository root file, you'll be forwarded to the correct location.
   - Alternatively run a simple local server (e.g. `npx serve docs`) to avoid file:// path issues.
2. Edit `assets/css/style.css` for styling changes and `assets/js/main.js` for additional behaviour.

## Deploying to GitHub Pages

This is configured as a **project site** using the `docs/` folder.

1. Create a repository named `marvinbaptista` (or whatever you prefer).
2. Push this code to the `main` branch of that repository.
3. In GitHub settings, under *Pages*, select the `main` branch and `docs/` folder as the source.
4. Wait a few minutes – your site will be available at:
   `https://<your-username>.github.io/marvinbaptista/`

> If you deploy to a subdirectory or repo with a different name, uncomment and update the `<base>` tag in `docs/index.html`.

## Scaling Tips

- Move page sections into partial HTML files and assemble with tooling if content grows.
- Use a build step (Webpack, Parcel, etc.) if you introduce JS modules or pre-process CSS.
- Store reusable assets in `assets/img` and reference them relatively.
- Consider using a static site generator (Jekyll, Hugo, Eleventy) for templating and markdown.

Enjoy building your portfolio! 🚀
