# Happy Birthday page

Static page, no build step. All texts live in the `CONFIG` block at the top of `script.js`.

## Preview locally

Open `index.html` in a browser. Shortcuts to jump to a scene while editing:
`index.html#letter`, `index.html#cake`, `index.html#finale`.

## Publish on GitHub Pages

1. Create a new repository on GitHub, e.g. `happy-birthday`.
2. In this folder:
   ```sh
   git init
   git add .
   git commit -m "Happy birthday"
   git branch -M main
   git remote add origin https://github.com/<username>/happy-birthday.git
   git push -u origin main
   ```
3. On GitHub: Settings → Pages → Source: "Deploy from a branch" → `main` / `(root)` → Save.
4. After a minute the page is at `https://<username>.github.io/happy-birthday/`.

Note: on a free account the repository and page are public. The page has `noindex`
so search engines skip it, but anyone with the link can open it.

## Microphone

Blowing out the candles with the microphone needs HTTPS (GitHub Pages is fine).
Tapping the flames always works.
