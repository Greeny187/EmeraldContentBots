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
    try {
        const response = await fetch('/api/auth/telegram', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user),
            credentials: 'include'  // Important for cookies
        });

        if (!response.ok) {
            throw new Error('Auth failed');
        }

        const data = await response.json();
        
        // Store auth data
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirect to dashboard with token
        window.location.href = `/dashboard?token=${data.access_token}`;
    } catch (error) {
        console.error('Authentication error:', error);
    }
}

// Check auth status on page load
window.onload = async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        try {
            const response = await fetch('/api/auth/check', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        }
    }
};