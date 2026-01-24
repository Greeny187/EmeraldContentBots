(function(){
  const qs = (s) => document.querySelector(s);
  const qa = (s) => Array.from(document.querySelectorAll(s));

  const tg = window.Telegram?.WebApp;

  function currentInitData(){
    // initData (inkl. Signatur) ist die einzige saubere Auth-Quelle fuer Backend-Calls
    return (window.Telegram?.WebApp?.initData || (typeof INIT_DATA !== 'undefined' ? INIT_DATA : '') || '').trim();
  }

  function toast(msg){
    const out = qs('#out');
    if(out) out.textContent = msg;
    try { tg?.showPopup?.({title:"Emerald", message: msg, buttons:[{type:"ok"}]}); } catch {}
  }

  async function api(path, opts={}){
    const res = await fetch(`${API_BASE}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(currentInitData() ? {'X-Telegram-Init-Data': currentInitData()} : {}),
        ...(opts.headers||{})
      }
    });
    let j=null;
    const ct = res.headers.get('content-type')||'';
    if(ct.includes('application/json')){
      j = await res.json();
    } else {
      const t = await res.text();
      j = { success: res.ok, text: t };
    }
    if(!res.ok) {
      const err = (j && (j.error || j.text)) ? (j.error || j.text) : `HTTP ${res.status}`;
      throw new Error(err);
    }
    return j;
  }

  function currentGroupName(){
    // best effort: Gruppenname aus UI, falls vorhanden
    const el = qs('#groupTitle') || qs('[data-current-group-title]');
    return (el?.textContent || '').trim() || 'Meine Gruppe';
  }

  async function createAndShare(template){
    if(!cid){
      toast("⚠️ Bitte zuerst eine Gruppe wählen.");
      return;
    }
    toast("🎞️ Erzeuge Story…");
    try {
      const j = await api(`/api/stories/create`, {
        method:'POST',
        body: JSON.stringify({
          chat_id: cid,
          template,
          group_name: currentGroupName()
        })
      });

      const share = j.share || {};
      const cardUrl = share.card_url;
      const ref = share.referral_link;

      if(!cardUrl){
        toast("⚠️ Kein card_url erhalten.");
        return;
      }

      // Telegram Story Share (falls verfügbar)
      if(tg?.shareToStory){
        try {
          const widget_link = ref ? { url: ref, name: "Join" } : undefined;
          await tg.shareToStory(cardUrl, {
            text: "💎 Emerald Ecosystem",
            widget_link
          });
          toast("✅ Story geteilt!");
          return;
        } catch(e){
          console.warn("shareToStory failed:", e);
        }
      }

      // Fallback: URL öffnen + Link kopieren
      try { window.open(cardUrl, "_blank"); } catch {}
      if(ref && navigator.clipboard){
        try { await navigator.clipboard.writeText(ref); } catch {}
      }
      toast("✅ Karte geöffnet. Referral-Link ggf. kopiert.");
    } catch(e){
      const msg = (e && e.message) ? e.message : String(e);
      if(msg.includes("rate_limited")){
        toast("⏳ Rate-Limit erreicht (heute).");
      } else if(msg.includes("auth_required") || msg.includes("forbidden")){
        toast("❌ Auth fehlt. Öffne die Miniapp über den Bot-Button in Telegram (nicht über einen normalen Link). Tipp: Telegram neu öffnen und nochmal versuchen.");
        toast(`⚠️ Story Fehler: ${msg}`);
      }
    }
  }

  async function loadMyShares(){
    if(!cid || !uid){
      toast("⚠️ Gruppe/UID fehlt.");
      return;
    }
    if(!tg || !INIT_DATA){
      toast("❌ Auth fehlt. Bitte die Mini-App über den /miniapp Button öffnen (WebApp, nicht Link).");
       return;
    }
    toast("Lade Shares…");
    try{
      const j = await api(`/api/stories/user/${encodeURIComponent(uid)}?chat_id=${encodeURIComponent(cid)}`, {method:'GET'});
      const box = qs('#user_shares_list');
      const list = box?.querySelector('.list');
      if(!box || !list) return;
      list.innerHTML = '';
      (j.shares || []).forEach(s=>{
        const div = document.createElement('div');
        div.className = 'item';
        div.innerHTML = `
          <div class="left">
            <div class="title">#${s.share_id} • ${s.template || ''}</div>
            <div class="hint">Clicks: ${s.clicks||0} • Conv: ${s.conversions||0}</div>
          </div>
          <button class="btn" data-open-card="${s.share_id}">🎴 Card</button>
        `;
        list.appendChild(div);
      });
      box.style.display = 'block';
      toast("✅ Shares geladen");
    }catch(e){
      const msg = (e && e.message) ? e.message : String(e);
      if(msg.includes("auth_required") || msg.includes("forbidden")){
        toast("❌ Auth fehlt. Bitte Miniapp wirklich als Telegram-WebApp starten (Button im Bot / Menu) – nicht im Browser.");
      } else {
        toast(`⚠️ Shares Fehler: ${msg}`);
      }
    }
  }

  async function loadTopShares(days=7, limit=10){
    if(!cid){
      toast("⚠️ Bitte zuerst eine Gruppe wählen.");
      return;
    }
    toast("Lade Leaderboard…");
    try{
      const j = await api(`/api/stories/top?chat_id=${encodeURIComponent(cid)}&days=${encodeURIComponent(days)}&limit=${encodeURIComponent(limit)}`, {method:'GET'});
      const box = qs('#top_shares_list');
      const list = box?.querySelector('.list');
      if(!box || !list) return;
      list.innerHTML = '';
      (j.shares || []).forEach(s=>{
        const div = document.createElement('div');
        div.className = 'item';
        div.innerHTML = `
          <div class="left">
            <div class="title">#${s.share_id} • ${s.template || ''}</div>
            <div class="hint">Shares: ${s.shares||0} • Clicks: ${s.clicks||0} • Conv: ${s.conversions||0}</div>
          </div>
          <button class="btn" data-open-card="${s.share_id}">🎴 Card</button>
        `;
        list.appendChild(div);
      });
      box.style.display = 'block';
      toast("✅ Leaderboard geladen");
    }catch(e){
      toast(`⚠️ Leaderboard Fehler: ${e.message||e}`);
    }
  }
  function wire(){
    qa('[data-story-action]').forEach(btn=>{
      btn.addEventListener('click', ()=>createAndShare(btn.getAttribute('data-story-action')));
    });
    qa('[data-load-user-shares]').forEach(btn=>{
      btn.addEventListener('click', loadMyShares);
    });
    qa('[data-load-top-shares]').forEach(btn=>{
      btn.addEventListener('click', ()=>loadTopShares());
    });
    document.addEventListener('click', (e)=>{
       const t = e.target;
       if(t && t.dataset && t.dataset.copy){
         navigator.clipboard.writeText(t.dataset.copy);
         toast("✅ Link kopiert");
       }
      if(t && t.dataset && t.dataset.openCard){
        const sid = t.dataset.openCard;
        const url = `${API_BASE}/api/stories/card/share/${sid}`;
        if(window.Telegram?.WebApp?.openLink) Telegram.WebApp.openLink(url);
        else window.open(url, "_blank");
      }
    });
  }

  // optional hook from main appcontent loadState()
  window.__onStateLoaded = function(state){
    try{
      const sharing = state?.sharing || {};
      const enabled = !!sharing.enabled;
      qa('[data-story-action]').forEach(b=>{
        b.disabled = !enabled;
        b.style.opacity = enabled ? '1' : '0.5';
      });
      // templates enable/disable
      const tmpl = sharing.templates || {};
      qa('[data-story-action]').forEach(b=>{
        const key = b.getAttribute('data-story-action');
        if(key in tmpl){
          b.style.display = tmpl[key] ? '' : 'none';
        }
      });
    }catch(e){}
  };
    // Leaderboard anzeigen (wenn aktiviert)
     try{
       const lb = !!sharing.leaderboard_enabled;
       const box = qs('#top_shares_list');
       if(box) box.style.display = lb ? 'block' : 'none';
       if(lb) loadTopShares();
     }catch{}
     
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', wire);
  }else{
    wire();
  }
})();
