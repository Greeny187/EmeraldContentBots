# ads_patch.py – exemplarische Funktionssignaturen mit bot_key (Default 'content')
# Diese Snippets in euer bestehendes ads.py integrieren.

from datetime import datetime
from typing import Optional

DEFAULT_BOT_KEY = "content"

def list_active_campaigns(bot_key: str = DEFAULT_BOT_KEY):
    sql = """
    SELECT campaign_id, title, body_text, media_url, link_url, cta_label, weight
      FROM adv_campaigns
     WHERE enabled=TRUE AND bot_key=%s
       AND (start_ts IS NULL OR NOW() >= start_ts)
       AND (end_ts IS NULL OR NOW() <= end_ts)
    """
    # cur.execute(sql, (bot_key,))

def get_adv_settings(chat_id: int, bot_key: str = DEFAULT_BOT_KEY):
    pass

def set_adv_settings(chat_id: int, bot_key: str = DEFAULT_BOT_KEY, **fields):
    pass

def set_adv_topic(chat_id: int, topic_id: Optional[int], bot_key: str = DEFAULT_BOT_KEY):
    pass

def record_impression(chat_id: int, campaign_id: int, message_id: int, bot_key: str = DEFAULT_BOT_KEY):
    pass

def is_pro_chat(chat_id: int, bot_key: str = DEFAULT_BOT_KEY) -> bool:
    return False

def set_pro_until(chat_id: int, until: Optional[datetime], tier: str = "pro", bot_key: str = DEFAULT_BOT_KEY):
    pass

def get_subscription_info(chat_id: int, bot_key: str = DEFAULT_BOT_KEY):
    return {}
