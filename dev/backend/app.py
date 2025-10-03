import os, time
from typing import Optional, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from db import fetch, fetchrow, execute
from jwt_tools import create_token, decode_token
from telegram_auth import verify_telegram_auth
import logging

app=FastAPI(title="Emerald DevDash API",version="0.2-min")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TelegramAuthPayload(BaseModel):
  id:int; auth_date:int; hash:str
  username: Optional[str]=None; first_name: Optional[str]=None; last_name: Optional[str]=None; photo_url: Optional[str]=None

class TokenResponse(BaseModel):
  access_token:str; token_type:str="bearer"

def get_current_user(authorization: Optional[str]=Header(None))->Dict[str,Any]:
  if not authorization or not authorization.lower().startswith("bearer "):
    raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
  try: return decode_token(authorization.split(" ",1)[1])
  except Exception as e: raise HTTPException(status_code=401, detail=str(e))

@app.get("/healthz")
async def healthz(): return {"status":"ok","time":int(time.time())}

@app.post("/auth/telegram", response_model=TokenResponse)
async def auth_telegram(payload:TelegramAuthPayload):
  logger.info(f"Telegram auth attempt for user: {payload.username}")
  user=verify_telegram_auth(payload.dict())
  await execute("""insert into dashboard_users(telegram_id,username,first_name,last_name,photo_url)
                 values($1,$2,$3,$4,$5)
                 on conflict(telegram_id) do update set username=excluded.username, first_name=excluded.first_name,
                 last_name=excluded.last_name, photo_url=excluded.photo_url, updated_at=now()""",
                 user["id"],user.get("username"),user.get("first_name"),user.get("last_name"),user.get("photo_url"))
  row=await fetchrow("select role,tier from dashboard_users where telegram_id=$1", user["id"])
  role=row["role"] if row else "dev"; tier=row["tier"] if row else "pro"
  tok=create_token({"sub":str(user["id"]), "tg":user, "role":role, "tier":tier})
  logger.info(f"Auth successful for user: {payload.username}")
  return TokenResponse(access_token=tok)

@app.get("/me")
async def me(current=Depends(get_current_user)): return {"user":current.get("tg"),"role":current.get("role"),"tier":current.get("tier")}

@app.get("/bots")
async def list_bots(current=Depends(get_current_user)):
  rows=await fetch("select id,name,slug,description,is_active from dashboard_bots order by id asc")
  return [dict(r) for r in rows]

class BotMeta(BaseModel):
  name:str; slug:str; description: Optional[str]=None; is_active: bool=True

@app.post("/bots")
async def add_bot(meta:BotMeta, current=Depends(get_current_user)):
  row=await fetchrow("insert into dashboard_bots(name,slug,description,is_active) values($1,$2,$3,$4) returning id,name,slug,description,is_active",
                     meta.name,meta.slug,meta.description,meta.is_active)
  return dict(row)

@app.get("/metrics/overview")
async def metrics_overview(current=Depends(get_current_user)):
  async def c(q):
    try: r=await fetchrow(q); return r["c"] if r and "c" in r else 0
    except Exception: return 0
  return {
    "users_total": await c("select count(1) as c from dashboard_users"),
    "ads_active": await c("select count(1) as c from dashboard_ads where is_active=true"),
    "bots_active": await c("select count(1) as c from dashboard_bots where is_active=true"),
  }

@app.get("/ads")
async def list_ads(current=Depends(get_current_user), bot_slug: Optional[str]=None):
  if bot_slug:
    rows=await fetch("""select id,name,placement,content,is_active,extract(epoch from start_at)::int as start_at,
                    extract(epoch from end_at)::int as end_at,targeting,bot_slug from dashboard_ads where bot_slug=$1 order by id desc""", bot_slug)
  else:
    rows=await fetch("""select id,name,placement,content,is_active,extract(epoch from start_at)::int as start_at,
                    extract(epoch from end_at)::int as end_at,targeting,bot_slug from dashboard_ads order by id desc""")
  return [dict(r) for r in rows]

class Ad(BaseModel):
  name:str; placement:str; content:str; is_active: bool=True
  start_at: Optional[int]=None; end_at: Optional[int]=None; targeting: Optional[dict]=None; bot_slug: Optional[str]=None

@app.post("/ads")
async def create_ad(ad:Ad, current=Depends(get_current_user)):
  row=await fetchrow("""insert into dashboard_ads(name,placement,content,is_active,start_at,end_at,targeting,bot_slug)
                      values($1,$2,$3,$4,to_timestamp($5),to_timestamp($6),$7,$8)
                      returning id,name,placement,content,is_active,extract(epoch from start_at)::int as start_at,
                      extract(epoch from end_at)::int as end_at,targeting,bot_slug""", ad.name,ad.placement,ad.content,ad.is_active,ad.start_at,ad.end_at,ad.targeting,ad.bot_slug)
  return dict(row)

@app.get("/tiers")
async def list_tiers(current=Depends(get_current_user), limit:int=100):
  rows=await fetch("select telegram_id,username,role,tier,created_at,updated_at from dashboard_users order by created_at desc limit $1", limit)
  out=[]; 
  for r in rows: d=dict(r); d["telegram_id"]=int(d["telegram_id"]); out.append(d)
  return out

class TierPatch(BaseModel):
  telegram_id:int; tier:str; role: Optional[str]=None

@app.post("/tiers")
async def set_tier(p:TierPatch, current=Depends(get_current_user)):
  await execute("update dashboard_users set tier=$2, role=coalesce($3, role), updated_at=now() where telegram_id=$1", p.telegram_id, p.tier, p.role)
  return {"ok":True}

@app.get("/feature-flags")
async def list_flags(current=Depends(get_current_user)):
  rows=await fetch("select key,value,description from dashboard_feature_flags order by key asc")
  return [dict(r) for r in rows]

class Flag(BaseModel):
  key:str; value:dict; description: Optional[str]=None

@app.post("/feature-flags")
async def upsert_flag(f:Flag, current=Depends(get_current_user)):
  row=await fetchrow("insert into dashboard_feature_flags(key,value,description) values($1,$2,$3) on conflict(key) do update set value=$2, description=$3 returning key,value,description",
                     f.key,f.value,f.description)
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
