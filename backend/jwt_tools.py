import os, time, jwt
def create_token(payload, exp_seconds=604800):
  s=os.getenv("SECRET_KEY")
  if not s: raise RuntimeError("SECRET_KEY env is missing")
  now=int(time.time())
  payload=dict(payload, iat=now, exp=now+exp_seconds)
  return jwt.encode(payload,s,algorithm="HS256")
def decode_token(t):
  s=os.getenv("SECRET_KEY")
  if not s: raise RuntimeError("SECRET_KEY env is missing")
  return jwt.decode(t,s,algorithms=["HS256"])
