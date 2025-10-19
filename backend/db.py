import os, asyncpg
_pool=None
async def get_pool():
  global _pool
  if _pool is None:
    db=os.getenv("DATABASE_URL")
    if not db: raise RuntimeError("DATABASE_URL is not set")
    _pool=await asyncpg.create_pool(dsn=db, min_size=1, max_size=5)
  return _pool
async def fetchrow(q,*a):
  p=await get_pool()
  async with p.acquire() as c: return await c.fetchrow(q,*a)
async def fetch(q,*a):
  p=await get_pool()
  async with p.acquire() as c: return await c.fetch(q,*a)
async def execute(q,*a):
  p=await get_pool()
  async with p.acquire() as c: return await c.execute(q,*a)
