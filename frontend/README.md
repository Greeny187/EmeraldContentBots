# Emerald DevDashboard – Frontend (v0.2)

## Konfiguration
In `index.html`:
```html
<script>
  window.__CONFIG__ = {
    API_BASE: "https://your-heroku-app.herokuapp.com",
    BOT_USERNAME: "YourTelegramBotUsername_without_@"
  };
</script>
```

## Deploy
- Repo → GitHub Pages aktivieren
- Auf Heroku `ALLOWED_ORIGINS` = deine Pages-URL
