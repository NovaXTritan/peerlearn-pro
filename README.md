# peerlearn-pro

Student peer-learning MVP — ready for GitHub Pages.

## Quick start
1. Create a **public repo** named **peerlearn-pro** on GitHub.
2. Upload **all files** from this folder into the repo.
3. Push to **main**  bra nch.
4. GitHub Actions (included) builds and deploys automatically to **Pages**.
5. Your site will be live at: `https://<your-username>.github.io/peerlearn-pro/`

## Local dev
```bash
npm ci
npm run dev
```
Open the local URL (default http://localhost:5173).

## Notes
- Router is **HashRouter** to avoid 404s on refresh.
- `vite.config.js` base is set to `/peerlearn-pro/` for correct asset paths on Pages.
- State is stored locally in the browser (Zustand). Export/delete in Settings.
- To use a **different repo name**, change `base` in `vite.config.js` to match the folder name: `/{your-repo}/`.
