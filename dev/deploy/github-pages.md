# GitHub Pages Deployment

1. `cd frontend`
2. `npm install`
3. `npm run build`
4. Inhalte aus `frontend/dist/` in den `gh-pages` Branch pushen oder `npm run deploy` verwenden (s. package.json).
5. In den Repository Settings → Pages → Branch auf `gh-pages` stellen.
6. `public/config.json` mit euren Admin-API-URLs pro Bot ausrollen.

## Mini App / Website einbinden
- In Telegram (BotFather) die WebApp-URL auf euren GitHub Pages Link setzen.
