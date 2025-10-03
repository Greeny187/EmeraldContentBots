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

async function handleTelegramAuth(user) {
    console.log('Telegram auth data:', user);
    try {
        const response = await fetch(`${API_BASE}/auth/telegram`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user),
            credentials: 'include'
        });
        
        console.log('Auth response status:', response.status);
        const data = await response.json();
        console.log('Auth response data:', data);

        if (!response.ok) {
            throw new Error(data.detail || 'Authentication failed');
        }

        // Store auth data and redirect
        localStorage.setItem('auth_token', data.access_token);
        window.location.href = '/dashboard';
    } catch (error) {
        console.error('Authentication error:', error);
        alert('Login failed: ' + error.message);
    }
}