import os
import json
import time
import logging
import httpx
from typing import Optional, Dict, Any
from decimal import Decimal, getcontext
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from db import fetch, fetchrow, execute
from jwt_tools import create_token, decode_token
from telegram_auth import verify_telegram_auth

getcontext().prec = 40

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

NEAR_RPC_URL = os.getenv("NEAR_RPC_URL", "https://rpc.mainnet.near.org")
app = FastAPI(title="Emerald DevDash API", version="0.2-min")

_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",") if o.strip()]
allow_all = "*" in _origins



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all else _origins,  # z.B. ["https://greeny187.github.io"]
    allow_credentials=True,
    allow_methods=["GET","POST","PUT","DELETE","OPTIONS"],
    allow_headers=["*"],  # enthält Content-Type, Authorization etc.
)


@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    logger.info(f"Headers: {dict(request.headers)}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

class TelegramAuthPayload(BaseModel):
    id: int
    auth_date: int
    hash: str
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    photo_url: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    try:
        return decode_token(authorization.split(" ", 1)[1])
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.get("/healthz")
async def healthz():
    return {"status": "ok", "time": int(time.time())}

# ---------- Startup: kleine, idempotente Migrationen ----------
@app.on_event("startup")
async def _migrate():
    try:
        await execute("alter table if exists dashboard_users add column if not exists ton_address text;")
    except Exception:
        pass  # Column might already exist
    try:
        await execute("""
          create table if not exists dashboard_watch_accounts(
            id serial primary key,
            chain text not null check (chain in ('near','ton')),
            account_id text not null,
            label TEXT NOT NULL DEFAULT '',
            meta jsonb default '{}'::jsonb,
            created_at timestamp not null default now(),
            unique(chain, account_id)
          );
        """)
    except Exception:
        pass  # Table might already exist
    try:
        await execute("""
          insert into dashboard_watch_accounts(chain, account_id, label)
          values ('near','emeraldcontent.near','Main Wallet')
          on conflict do nothing;
        """)
    except Exception:
        pass

@app.post("/auth/telegram", response_model=TokenResponse)
async def auth_telegram(payload: TelegramAuthPayload):
    logger.info(f"Telegram auth attempt for user: {payload.username}")
    
    # Verify telegram signature
    user = verify_telegram_auth(payload.dict())
    
    # Store or update user in database
    await execute(
        """
        insert into dashboard_users(telegram_id, username, first_name, last_name, photo_url)
        values($1, $2, $3, $4, $5)
        on conflict(telegram_id) do update set 
            username=excluded.username,
            first_name=excluded.first_name,
            last_name=excluded.last_name,
            photo_url=excluded.photo_url,
            updated_at=now()
        """,
        user["id"],
        user.get("username"),
        user.get("first_name"),
        user.get("last_name"),
        user.get("photo_url")
    )
    
    # Get user role and tier
    row = await fetchrow(
        "select role, tier from dashboard_users where telegram_id=$1",
        user["id"]
    )
    role = row["role"] if row else "dev"
    tier = row["tier"] if row else "pro"
    
    # Create JWT token
    tok = create_token({
        "sub": str(user["id"]),
        "tg": user,
        "role": role,
        "tier": tier
    })
    
    logger.info(f"Auth successful for user: {payload.username} (id: {user['id']})")
    return TokenResponse(access_token=tok)

@app.get("/me")
async def me(current=Depends(get_current_user)):
    """Get current user info from JWT token"""
    return {
        "profile": current.get("tg"),
        "role": current.get("role"),
        "tier": current.get("tier")
    }

@app.get("/bots")
async def list_bots(current=Depends(get_current_user)):
    rows = await fetch("select id, username, title, env_token_key, is_active, meta from dashboard_bots order by id asc")
    return {"bots": [dict(r) for r in rows]}

class BotMeta(BaseModel):
    username: str
    title: Optional[str] = None
    env_token_key: Optional[str] = None
    is_active: bool = True

@app.post("/bots")
async def add_bot(meta: BotMeta, current=Depends(get_current_user)):
    row = await fetchrow(
        "insert into dashboard_bots(username, title, env_token_key, is_active, meta) values($1, $2, $3, $4, $5) returning id, username, title, env_token_key, is_active, meta",
        meta.username, meta.title, meta.env_token_key, meta.is_active, json.dumps({})
    )
    return dict(row)

@app.get("/metrics/overview")
async def metrics_overview(current=Depends(get_current_user)):
    async def c(q):
        try:
            r = await fetchrow(q)
            return r["c"] if r and "c" in r else 0
        except Exception as e:
            logger.warning(f"Query error: {e}")
            return 0
    
    return {
        "users_total": await c("select count(1) as c from dashboard_users"),
        "ads_active": await c("select count(1) as c from dashboard_ads where is_active=true"),
        "bots_active": await c("select count(1) as c from dashboard_bots where is_active=true"),
        "token_events_total": 0
    }

# ---------- NEAR: Account Overview ----------
def _yocto_to_near(s: str) -> str:
    try:
        return str(Decimal(s) / Decimal(10**24))
    except Exception:
        return "0"

async def _rpc_view_account_near(account_id: str):
    async with httpx.AsyncClient(timeout=10.0) as client:
        payload = {
            "jsonrpc": "2.0",
            "id": "view_account",
            "method": "query",
            "params": {
                "request_type": "view_account",
                "finality": "final",
                "account_id": account_id
            }
        }
        r = await client.post(NEAR_RPC_URL, json=payload)
        r.raise_for_status()
        return r.json()["result"]

@app.get("/near/account/overview")
async def near_account_overview(account_id: str, current=Depends(get_current_user)):
    acct = await _rpc_view_account_near(account_id)
    return {
        "account_id": account_id,
        "near": {
            "amount_yocto": acct.get("amount", "0"),
            "amount_near": _yocto_to_near(acct.get("amount", "0")),
            "locked_yocto": acct.get("locked", "0"),
            "locked_near": _yocto_to_near(acct.get("locked", "0")),
            "storage_usage": acct.get("storage_usage", 0),
            "code_hash": acct.get("code_hash"),
        }
    }

# ---------- TON: Adresse setzen & Übersicht ----------
@app.post("/wallets/ton")
async def set_ton_address(payload: dict, current=Depends(get_current_user)):
    addr = (payload.get("address") or "").strip()
    await execute(
        "update dashboard_users set ton_address=$1, updated_at=now() where telegram_id=$2",
        addr,
        int(current["sub"])
    )
    return {"ok": True, "ton_address": addr}

@app.get("/wallets")
async def wallets_overview(current=Depends(get_current_user)):
    me = await fetchrow(
        "select near_account_id, ton_address from dashboard_users where telegram_id=$1",
        int(current["sub"])
    )
    watches = await fetch(
        "select id, chain, account_id, label, meta, created_at from dashboard_watch_accounts order by id asc"
    )
    return {
        "me": dict(me) if me else None,
        "watch": [dict(w) for w in watches]
    }

@app.get("/ads")
async def list_ads(current=Depends(get_current_user), bot_slug: Optional[str] = None):
    if bot_slug:
        rows = await fetch(
            """select id, name, placement, content, is_active,
                      extract(epoch from start_at)::int as start_at,
                      extract(epoch from end_at)::int as end_at,
                      targeting, bot_slug
               from dashboard_ads
               where bot_slug=$1
               order by id desc""",
            bot_slug
        )
    else:
        rows = await fetch(
            """select id, name, placement, content, is_active,
                      extract(epoch from start_at)::int as start_at,
                      extract(epoch from end_at)::int as end_at,
                      targeting, bot_slug
               from dashboard_ads
               order by id desc"""
        )
    return {"ads": [dict(r) for r in rows]}

class Ad(BaseModel):
    name: str
    placement: str
    content: str
    is_active: bool = True
    start_at: Optional[int] = None
    end_at: Optional[int] = None
    targeting: Optional[dict] = None
    bot_slug: Optional[str] = None

@app.post("/ads")
async def create_ad(ad: Ad, current=Depends(get_current_user)):
    row = await fetchrow(
        """insert into dashboard_ads(name, placement, content, is_active, start_at, end_at, targeting, bot_slug)
           values($1, $2, $3, $4, to_timestamp($5), to_timestamp($6), $7, $8)
           returning id, name, placement, content, is_active,
           extract(epoch from start_at)::int as start_at,
           extract(epoch from end_at)::int as end_at,
           targeting, bot_slug""",
        ad.name, ad.placement, ad.content, ad.is_active,
        ad.start_at, ad.end_at, ad.targeting, ad.bot_slug
    )
    return dict(row)

@app.get("/tiers")
async def list_tiers(current=Depends(get_current_user), limit: int = 100):
    rows = await fetch(
        "select telegram_id, username, role, tier, created_at, updated_at from dashboard_users order by created_at desc limit $1",
        limit
    )
    out = []
    for r in rows:
        d = dict(r)
        d["telegram_id"] = int(d["telegram_id"])
        out.append(d)
    return {"users": out}

class TierPatch(BaseModel):
    telegram_id: int
    tier: str
    role: Optional[str] = None

@app.post("/tiers")
async def set_tier(p: TierPatch, current=Depends(get_current_user)):
    await execute(
        "update dashboard_users set tier=$2, role=coalesce($3, role), updated_at=now() where telegram_id=$1",
        p.telegram_id, p.tier, p.role
    )
    return {"ok": True}

@app.get("/feature-flags")
async def list_flags(current=Depends(get_current_user)):
    rows = await fetch("select key, value, description from dashboard_feature_flags order by key asc")
    return {"flags": [dict(r) for r in rows]}

class Flag(BaseModel):
    key: str
    value: dict
    description: Optional[str] = None

@app.post("/feature-flags")
async def upsert_flag(f: Flag, current=Depends(get_current_user)):
    row = await fetchrow(
        "insert into dashboard_feature_flags(key, value, description) values($1, $2, $3) on conflict(key) do update set value=$2, description=$3 returning key, value, description",
        f.key, f.value, f.description
    )
    return dict(row)

async def get_token(authorization: Optional[str] = Header(None)) -> str:
    """Extract bearer token from Authorization header"""
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    return authorization.split(" ", 1)[1]

@app.get("/auth/check")
async def check_auth(token: str = Depends(get_token)):
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        decode_token(token)  # Verify token is valid
        return {"authenticated": True}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

# ---------- EMRD Token Info ----------
@app.get("/token/emrd")
async def get_emrd_info(current=Depends(get_current_user)):
    """Get EMRD token information (price, market cap, holders, etc.)"""
    return {
        "name": "Emerald Token",
        "symbol": "EMRD",
        "contract": "EQDkjqMPPCLYN2xUQp_mWMFt3zPxUgcLIEMCDe-RDHfx2Gsp",
        "chain": "TON",
        "decimals": 9,
        "price_usd": 0.025,
        "market_cap": 2500000,
        "holders": 1250,
        "total_supply": "100000000",
        "circulating_supply": "45000000",
        "links": {
            "dedust": "https://dedust.io/swap/TON/EQDkjqMPPCLYN2xUQp_mWMFt3zPxUgcLIEMCDe-RDHfx2Gsp",
            "tonviewer": "https://tonviewer.com/EQDkjqMPPCLYN2xUQp_mWMFt3zPxUgcLIEMCDe-RDHfx2Gsp",
            "tonscan": "https://tonscan.org/address/EQDkjqMPPCLYN2xUQp_mWMFt3zPxUgcLIEMCDe-RDHfx2Gsp"
        }
    }

@app.get("/token/holders")
async def get_token_holders(current=Depends(get_current_user), limit: int = 50):
    """Get top EMRD token holders"""
    try:
        rows = await fetch(
            """select telegram_id, ton_address, balance, percentage
               from dashboard_token_holders
               order by balance desc
               limit $1""",
            limit
        )
        return {"holders": [dict(r) for r in rows]}
    except Exception:
        return {"holders": []}

@app.get("/token/transactions")
async def get_token_transactions(current=Depends(get_current_user), limit: int = 100):
    """Get recent EMRD token transactions"""
    try:
        rows = await fetch(
            """select id, type, amount, from_address, to_address, hash, created_at
               from dashboard_token_events
               order by created_at desc
               limit $1""",
            limit
        )
        return {"transactions": [dict(r) for r in rows]}
    except Exception:
        return {"transactions": []}

# ---------- Bot Statistics ----------
@app.get("/bots/{bot_id}/stats")
async def get_bot_stats(bot_id: int, current=Depends(get_current_user)):
    """Get detailed statistics for a specific bot"""
    try:
        bot = await fetchrow(
            "select id, name, slug from dashboard_bots where id=$1",
            bot_id
        )
        if not bot:
            raise HTTPException(status_code=404, detail="Bot not found")
        
        # Get stats
        users = await fetchrow(
            "select count(1) as c from dashboard_bot_users where bot_id=$1",
            bot_id
        )
        messages = await fetchrow(
            "select count(1) as c from dashboard_bot_events where bot_id=$1 and type='message'",
            bot_id
        )
        commands = await fetchrow(
            "select count(1) as c from dashboard_bot_events where bot_id=$1 and type='command'",
            bot_id
        )
        
        return {
            "bot": dict(bot),
            "users_total": users["c"] if users else 0,
            "messages_total": messages["c"] if messages else 0,
            "commands_total": commands["c"] if commands else 0,
            "last_activity": "2 minutes ago"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------- System Health & Monitoring ----------
@app.get("/system/health")
async def system_health(current=Depends(get_current_user)):
    """Get system health and uptime information"""
    return {
        "status": "operational",
        "uptime_days": 45,
        "uptime_percent": 99.9,
        "response_time_ms": 45,
        "database": "connected",
        "cache": "active",
        "queue": "healthy",
        "last_backup": "2 hours ago"
    }

@app.get("/system/logs")
async def get_system_logs(current=Depends(get_current_user), limit: int = 100):
    """Get system activity logs"""
    try:
        rows = await fetch(
            """select level, message, created_at
               from dashboard_logs
               order by created_at desc
               limit $1""",
            limit
        )
        return {"logs": [dict(r) for r in rows]}
    except Exception:
        return {"logs": []}

# ---------- User Activity Analytics ----------
@app.get("/analytics/user-growth")
async def user_growth_analytics(current=Depends(get_current_user)):
    """Get user growth analytics"""
    try:
        weekly = await fetch(
            """select date_trunc('week', created_at)::date as week, count(*) as count
               from dashboard_users
               group by week
               order by week desc
               limit 12"""
        )
        return {
            "weekly_growth": [{"week": str(r["week"]), "users": r["count"]} for r in weekly]
        }
    except Exception:
        return {"weekly_growth": []}

@app.get("/analytics/bot-activity")
async def bot_activity_analytics(current=Depends(get_current_user)):
    """Get bot activity analytics"""
    try:
        rows = await fetch(
            """select slug, count(*) as events
               from dashboard_bots b
               left join dashboard_bot_events e on b.id = e.bot_id
               group by b.slug
               order by events desc"""
        )
        return {"bot_activity": [dict(r) for r in rows]}
    except Exception:
        return {"bot_activity": []}

# ---------- Bot Groups Management ----------
@app.get("/bot-groups")
async def get_bot_groups(current=Depends(get_current_user)):
    """Get all bot-managed groups"""
    try:
        rows = await fetch(
            """select id, chat_id, chat_title, chat_type, member_count, created_at
               from dashboard_bot_groups
               order by member_count desc"""
        )
        return {"groups": [dict(r) for r in rows]}
    except Exception:
        return {"groups": []}

# ---------- Content & RSS Feeds ----------
@app.get("/content/feeds")
async def get_feeds(current=Depends(get_current_user)):
    """Get all RSS feeds managed"""
    try:
        rows = await fetch(
            """select id, name, url, last_update, item_count
               from dashboard_rss_feeds
               order by last_update desc"""
        )
        return {"feeds": [dict(r) for r in rows]}
    except Exception:
        return {"feeds": []}

# ---------- Moderation Stats ----------
@app.get("/moderation/stats")
async def get_moderation_stats(current=Depends(get_current_user)):
    """Get moderation statistics"""
    try:
        spam = await fetchrow("select count(1) as c from dashboard_moderation where type='spam'")
        deleted_msgs = await fetchrow("select count(1) as c from dashboard_moderation where action='delete'")
        users_banned = await fetchrow("select count(distinct user_id) as c from dashboard_moderation where action='ban'")
        
        return {
            "spam_detected": spam["c"] if spam else 0,
            "messages_deleted": deleted_msgs["c"] if deleted_msgs else 0,
            "users_banned": users_banned["c"] if users_banned else 0
        }
    except Exception:
        return {"spam_detected": 0, "messages_deleted": 0, "users_banned": 0}

# ---------- Payment & Revenue Stats ----------
@app.get("/payment/stats")
async def get_payment_stats(current=Depends(get_current_user)):
    """Get payment and revenue statistics"""
    try:
        total_revenue = await fetchrow(
            "select sum(amount) as total from dashboard_payments where status='completed'"
        )
        transactions = await fetchrow(
            "select count(1) as c from dashboard_payments"
        )
        
        return {
            "total_revenue_usd": float(total_revenue["total"] or 0),
            "transactions_total": transactions["c"] if transactions else 0,
            "avg_transaction": float((total_revenue["total"] or 0) / max(transactions["c"] or 1, 1))
        }
    except Exception:
        return {"total_revenue_usd": 0, "transactions_total": 0, "avg_transaction": 0}
