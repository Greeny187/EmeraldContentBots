    # backend/admin_api.py
    # FastAPI Router, der in jeden bestehenden Bot (Heroku) integriert werden kann.
    # Endpunkte liefern/ändern Admin-Daten für Stats, PRO, Ads – pro Bot-Instanz.

    from fastapi import APIRouter, Depends, HTTPException, Header, Request
    from pydantic import BaseModel, Field
    from typing import Optional, List, Dict, Any
    import hmac, hashlib, os, urllib.parse

    router = APIRouter(prefix="/api/admin/v1", tags=["admin"])

    ADMIN_IDS = {int(x) for x in os.getenv("ADMIN_IDS","").split(",") if x.strip().isdigit()}
    TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN","")
    ALLOWED_ORIGINS = {x.strip() for x in os.getenv("ALLOWED_ORIGINS","").split(",") if x.strip()}

    def verify_telegram_initdata(init_data: str) -> Dict[str, Any]:
        # Verify per Telegram docs
        secret = hashlib.sha256(TELEGRAM_BOT_TOKEN.encode()).digest()
        parsed = urllib.parse.parse_qs(init_data, keep_blank_values=True, strict_parsing=False)
        data_check_string = "".join(
            f"{k}={v[0]}" for k,v in sorted(parsed.items()) if k != "hash"
        )
        hash_hex = (parsed.get("hash") or [""])[0]
        calc_hash = hmac.new(secret, data_check_string.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(calc_hash, hash_hex):
            raise HTTPException(status_code=401, detail="Invalid initData hash")
        # Extract user id
        from json import loads
        user_json = (parsed.get("user") or ["{}"])[0]
        user = loads(user_json or "{}")
        return {"user": user}

    async def require_admin(request: Request, x_telegram_init_data: Optional[str] = Header(None)):
        origin = request.headers.get("origin","")
        if ALLOWED_ORIGINS and origin and origin not in ALLOWED_ORIGINS:
            raise HTTPException(status_code=403, detail="Origin not allowed")
        if not x_telegram_init_data:
            raise HTTPException(status_code=401, detail="Missing init data")
        data = verify_telegram_initdata(x_telegram_init_data)
        uid = data.get("user",{}).get("id")
        if not uid or int(uid) not in ADMIN_IDS:
            raise HTTPException(status_code=403, detail="Not an admin")
        return data

    # ---- Schemas ----

    class Period(BaseModel):
        frm: Optional[str] = None  # ISO
        to: Optional[str] = None

    class ProSetRequest(BaseModel):
        chat_id: int
        until: Optional[str] = None  # ISO datetime
        tier: str = "pro"

    class ProBulkExtendRequest(BaseModel):
        chat_ids: List[int] = Field(default_factory=list)
        days: int = 30

    class Campaign(BaseModel):
        title: str
        body_text: str
        link_url: Optional[str] = None
        media_url: Optional[str] = None
        cta_label: Optional[str] = None
        weight: int = 1
        enabled: bool = True

    class CampaignPatch(BaseModel):
        title: Optional[str] = None
        body_text: Optional[str] = None
        link_url: Optional[str] = None
        media_url: Optional[str] = None
        cta_label: Optional[str] = None
        weight: Optional[int] = None
        enabled: Optional[bool] = None

    # ---- Endpoints (Beispiele) ----

    @router.get("/stats/overview")
    async def stats_overview(p: Period = Depends(), _=Depends(require_admin)):
        # TODO: DB-Abfragen – gruppiert je bot_key dieser Instanz
        return {
            "bot_key": os.getenv("BOT_KEY","content"),
            "groups_total": 0,
            "active_today": 0,
            "messages_today": 0,
            "unique_users_today": 0,
            "version": os.getenv("APP_VERSION","dev"),
        }

    @router.get("/stats/groups")
    async def stats_groups(page: int = 1, q: Optional[str] = None, _=Depends(require_admin)):
        # TODO: SELECT ... FROM message_logs/aggregations WHERE bot_key=this
        return {"page": page, "items": []}

    @router.get("/pro/status")
    async def pro_status(chat_id: int, _=Depends(require_admin)):
        # TODO: SELECT * FROM group_subscriptions WHERE bot_key=this AND chat_id=...
        return {"chat_id": chat_id, "tier": "free", "until": None}

    @router.post("/pro/set")
    async def pro_set(req: ProSetRequest, _=Depends(require_admin)):
        # TODO: UPDATE group_subscriptions SET until=..., tier=... WHERE bot_key=this AND chat_id=...
        return {"ok": True}

    @router.post("/pro/bulk_extend")
    async def pro_bulk_extend(req: ProBulkExtendRequest, _=Depends(require_admin)):
        # TODO: UPDATE ... +days for each chat
        return {"ok": True, "count": len(req.chat_ids)}

    @router.get("/ads/campaigns")
    async def ads_campaigns(_=Depends(require_admin)):
        # TODO: SELECT * FROM adv_campaigns WHERE bot_key=this
        return {"items": []}

    @router.post("/ads/campaigns")
    async def ads_campaigns_create(c: Campaign, _=Depends(require_admin)):
        # TODO: INSERT INTO adv_campaigns (..., bot_key=this)
        return {"ok": True}

    @router.patch("/ads/campaigns/{campaign_id}")
    async def ads_campaigns_patch(campaign_id: int, patch: CampaignPatch, _=Depends(require_admin)):
        # TODO: UPDATE adv_campaigns SET ... WHERE id=... AND bot_key=this
        return {"ok": True}

    @router.get("/ads/settings")
    async def ads_settings(chat_id: int, _=Depends(require_admin)):
        # TODO: SELECT settings WHERE (bot_key, chat_id)
        return {"chat_id": chat_id, "adv_enabled": True}

    @router.post("/ads/settings/set")
    async def ads_settings_set(payload: Dict[str, Any], _=Depends(require_admin)):
        # payload: { chat_id, adv_enabled?, min_gap_min?, daily_cap?, every_n_messages?, label?, quiet_start_min?, quiet_end_min?, topic? }
        # TODO: UPSERT adv_settings with bot_key=this
        return {"ok": True}

    @router.get("/ads/stats")
    async def ads_stats(_=Depends(require_admin)):
        # TODO: SELECT counts FROM adv_impressions WHERE bot_key=this
        return {"today": 0, "total": 0}

    # Integration: in eurer Bot-App:
    # from backend.admin_api import router as admin_router
    # app.include_router(admin_router)
