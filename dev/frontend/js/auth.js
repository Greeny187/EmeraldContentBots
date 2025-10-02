// Telegram Login Button dynamisch einfügen
(function mountLogin() {
  const slot = document.getElementById("tgLoginSlot");
  const bot = window.__CONFIG__.BOT_USERNAME;
  const script = document.createElement("script");
  script.src = "https://telegram.org/js/telegram-widget.js?22";
  script.async = true;
  script.setAttribute("data-telegram-login", bot);
  script.setAttribute("data-size", "large");
  script.setAttribute("data-userpic", "true");
  script.setAttribute("data-request-access", "write");
  script.setAttribute("data-onauth", "onTelegramAuth");
  slot.appendChild(script);
})();

async function onTelegramAuth(user) {
  const payload = {
    id: user.id,
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    photo_url: user.photo_url,
    auth_date: user.auth_date,
    hash: user.hash
  };
  const data = await API.post("/auth/telegram", payload);
  API.setToken(data.access_token);
  document.getElementById("loginCard").classList.add("hidden");
  await window.App.initAfterLogin();
}

API.loadToken();