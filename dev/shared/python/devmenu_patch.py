# devmenu_patch.py – Auswahl Bot/Gruppe und Durchreichen des bot_key

def with_bot_key(context, default="content"):
    return context.user_data.get("bot_key", default)

def set_bot_key(context, bot_key: str):
    context.user_data["bot_key"] = bot_key

# Alle Handler/Wizards beim Aufruf den bot_key mitgeben.
