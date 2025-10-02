import os,hmac,hashlib,time
def _dcs(d): return "\n".join(f"{k}={d[k]}" for k in sorted([k for k in d if k!='hash']))
def verify_telegram_auth(p):
  for r in ["id","auth_date","hash"]:
    if r not in p: raise ValueError(f"Missing {r}")
  tok=os.getenv("BOT_TOKEN")
  if not tok: raise ValueError("BOT_TOKEN is not set")
  key=hashlib.sha256(tok.encode()).digest()
  if hmac.new(key,_dcs(p).encode(),hashlib.sha256).hexdigest()!=p.get("hash"): raise ValueError("Bad hash")
  ttl=int(os.getenv("TELEGRAM_LOGIN_TTL_SECONDS","86400"))
  if time.time()-int(p["auth_date"])>ttl: raise ValueError("Auth payload expired")
  return {"id":int(p["id"]), "username":p.get("username"), "first_name":p.get("first_name"), "last_name":p.get("last_name"), "photo_url":p.get("photo_url")}
