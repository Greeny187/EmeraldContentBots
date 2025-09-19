# payments_patch.py – bot_key an Orders/Checkout/Webhooks durchreichen

def create_checkout(chat_id: int, provider: str, plan_key: str, user_id: int, bot_key: str = "content"):
    # order_id = create_payment_order(..., bot_key=bot_key)
    # return provider_url
    pass

def handle_webhook(provider: str, payload: dict):
    # bot_key = payload.get("bot_key","content")
    # set_pro_until(chat_id, until, tier="pro", bot_key=bot_key)
    pass
