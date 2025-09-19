export function initTelegramUI() {
  // @ts-ignore
  const tg = window?.Telegram?.WebApp
  if (tg) {
    tg.expand()
    tg.ready()
    tg.MainButton.setParams({ text: 'Close', is_visible: false })
  }
}
