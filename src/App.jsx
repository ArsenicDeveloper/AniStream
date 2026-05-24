import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════
   APIs USED
   1. Jikan (api.jikan.moe)  — 20,000+ anime, free, no key
      ↳ search, browse, genre filter, all anime data + images
   2. megaplay.buzz          — video embed (4 server routes)
   3. vidsrc.to / vidsrc.xyz — extra backup servers
═══════════════════════════════════════════════════════════ */
const JIKAN = "https://api.jikan.moe/v4";

// Genre name → Jikan genre ID map
const GENRE_IDS = {
  Action:11, Adventure:2, Comedy:4, Drama:8, Fantasy:10,
  Horror:14, Mystery:7, Romance:22, "Sci-Fi":24,
  "Slice of Life":36, Sports:30, Supernatural:37,
  Thriller:41, Psychological:40, Historical:13, Mecha:18,
};
const ALL_GENRES = ["All", ...Object.keys(GENRE_IDS)];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const fetchJikan = async ({ page = 1, search = "", genre = "All" } = {}) => {
  await sleep(300); // small delay to respect rate limit
  let url;
  if (search.trim()) {
    url = `${JIKAN}/anime?q=${encodeURIComponent(search.trim())}&type=tv&limit=24&sfw=true&page=${page}&order_by=popularity&sort=asc`;
  } else if (genre !== "All" && GENRE_IDS[genre]) {
    url = `${JIKAN}/anime?genres=${GENRE_IDS[genre]}&type=tv&order_by=score&sort=desc&limit=24&sfw=true&page=${page}`;
  } else {
    url = `${JIKAN}/top/anime?type=tv&limit=24&page=${page}&filter=bypopularity`;
  }
  const res  = await fetch(url);
  const json = await res.json();
  return {
    list    : json.data    || [],
    hasMore : json.pagination?.has_next_page || false,
    page    : json.pagination?.current_page  || page,
  };
};

/* ═══════════════════════════════════════════════════════════
   VIDEO SERVERS
   All use the anime's MAL ID (Jikan gives us mal_id directly)
═══════════════════════════════════════════════════════════ */
const SERVERS = [
  { id:"s1", label:"Server 1", tag:"HD",
    url: (a,ep,lang) => `https://megaplay.buzz/stream/mal/${a.mal_id}/${ep}/${lang}` },
  { id:"s2", label:"Server 2", tag:"HD",
    url: (a,ep,lang) => `https://megaplay.buzz/stream/mal/${a.mal_id}/${ep}/${lang==="sub"?"dub":"sub"}` },
  { id:"s3", label:"Server 3", tag:"ALT",
    url: (a,ep) => `https://vidsrc.to/embed/anime/${a.mal_id}/${ep}` },
  { id:"s4", label:"Server 4", tag:"ALT",
    url: (a,ep) => `https://vidsrc.xyz/embed/anime?id=${a.mal_id}&ep=${ep}` },
];

/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */
const titleOf  = (a) => a.title_english || a.title || "Unknown";
const imageOf  = (a) => a.images?.webp?.large_image_url || a.images?.jpg?.large_image_url || a.images?.jpg?.image_url;
const scoreOf  = (a) => a.score ? a.score.toFixed(1) : "N/A";
const genresOf = (a) => (a.genres || []).map((g) => g.name);
const totalEps = (a) => a.episodes || (a.airing ? "?" : 12);
const epList   = (a) => Array.from({ length: Math.min(Number(totalEps(a)) || 12, 200) }, (_, i) => i + 1);

const SCHEDULE = [
  { day:"Mon", shows:["One Piece","Bleach"] },
  { day:"Tue", shows:["Jujutsu Kaisen"] },
  { day:"Wed", shows:["Blue Lock","Solo Leveling"] },
  { day:"Thu", shows:["Frieren"] },
  { day:"Fri", shows:["Demon Slayer"] },
  { day:"Sat", shows:["Attack on Titan"] },
  { day:"Sun", shows:["Naruto","Dragon Ball Super"] },
];

/* ═══════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════ */
const Ic = {
  Star  : () => <svg width="11" height="11" viewBox="0 0 24 24" fill="#fbbf24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  Play  : ({s=24}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>,
  Search: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  X     : ({s=18}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Bm    : ({on}) => <svg width="15" height="15" viewBox="0 0 24 24" fill={on?"currentColor":"none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  ChevL : () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>,
  Menu  : () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Skip  : () => <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,4 15,12 5,20"/><rect x="17" y="4" width="2" height="16"/></svg>,
};

/* ═══════════════════════════════════════════════════════════
   ANIME CARD
═══════════════════════════════════════════════════════════ */
function AnimeCard({ a, onClick, bookmarked, onBookmark }) {
  const [hov, setHov] = useState(false);
  const img = imageOf(a);

  return (
    <div onClick={() => onClick(a)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ position:"relative", cursor:"pointer", borderRadius:10, overflow:"hidden", background:"#0d1421",
        transform: hov ? "translateY(-5px) scale(1.02)" : "none",
        boxShadow: hov ? "0 20px 50px rgba(0,0,0,.75)" : "0 4px 18px rgba(0,0,0,.4)",
        transition:"transform .22s ease, box-shadow .22s ease" }}>
      <div style={{ position:"relative", paddingBottom:"145%", overflow:"hidden" }}>
        {img
          ? <img src={img} alt={titleOf(a)} loading="lazy"
              style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover",
                transform: hov ? "scale(1.06)" : "scale(1)", transition:"transform .38s ease" }}/>
          : <div style={{ position:"absolute", inset:0, background:"#111927", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>🎌</div>
        }
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(7,11,18,1) 0%, rgba(7,11,18,.35) 55%, transparent 100%)" }}/>

        <div style={{ position:"absolute", top:8, left:8, background: a.airing ? "#059669" : "#374151",
          color:"#fff", fontSize:9, fontWeight:700, padding:"3px 7px", borderRadius:20, textTransform:"uppercase", letterSpacing:.8 }}>
          {a.airing ? "Ongoing" : "Completed"}
        </div>

        <button onClick={e => { e.stopPropagation(); onBookmark(a.mal_id); }}
          style={{ position:"absolute", top:7, right:7, background:"rgba(0,0,0,.6)", border:"none",
            color: bookmarked ? "#e040fb" : "#9ca3af", cursor:"pointer", borderRadius:7, padding:"5px 6px", display:"flex" }}>
          <Ic.Bm on={bookmarked}/>
        </button>

        {hov && (
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,.2)" }}>
            <div style={{ width:48, height:48, borderRadius:"50%", background:"#e040fb", color:"#fff",
              display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 28px #e040fb88" }}>
              <Ic.Play s={18}/>
            </div>
          </div>
        )}

        <div style={{ position:"absolute", bottom:7, left:8, right:8 }}>
          <div style={{ color:"#fff", fontSize:12, fontWeight:700, lineHeight:1.3, marginBottom:4, textShadow:"0 2px 8px rgba(0,0,0,.9)" }}>
            {titleOf(a)}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <Ic.Star/>
            <span style={{ color:"#fbbf24", fontSize:10, fontWeight:600 }}>{scoreOf(a)}</span>
            <span style={{ color:"#374151" }}>·</span>
            <span style={{ color:"#6b7280", fontSize:10 }}>{a.year || ""}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   WATCH VIEW
═══════════════════════════════════════════════════════════ */
function WatchView({ anime, startEp, onBack, bookmarked, onBookmark }) {
  const [ep, setEp]             = useState(startEp);
  const [lang, setLang]         = useState("sub");
  const [srv, setSrv]           = useState(SERVERS[0]);
  const [autoPlay, setAutoPlay] = useState(true);
  const [autoSkip, setAutoSkip] = useState(true);
  const [showSkip, setShowSkip] = useState(false);
  const [epGrid, setEpGrid]     = useState(true);
  const [nextBanner, setNextBanner] = useState(false);
  const [countdown, setCountdown]   = useState(5);
  const epRef    = useRef(null);
  const countRef = useRef(null);
  const eps      = epList(anime);
  const total    = eps.length;
  const title    = titleOf(anime);
  const img      = imageOf(anime);
  const embedUrl = srv.url(anime, ep, lang);

  const goNext = useCallback(() => {
    if (ep < total) {
      setEp(e => e + 1); setShowSkip(false); setNextBanner(false);
      setCountdown(5); clearInterval(countRef.current);
    }
  }, [ep, total]);

  useEffect(() => {
    const h = (e) => {
      try {
        const d = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (!d) return;
        const t = d.time ?? d.currentTime;
        if (t !== undefined) setShowSkip(autoSkip && t >= 82 && t <= 215);
        if (d.event === "complete" && autoPlay && ep < total) {
          setNextBanner(true); setCountdown(5);
          countRef.current = setInterval(() => setCountdown(v => {
            if (v <= 1) { clearInterval(countRef.current); goNext(); return 5; }
            return v - 1;
          }), 1000);
        }
      } catch {}
    };
    window.addEventListener("message", h);
    return () => { window.removeEventListener("message", h); clearInterval(countRef.current); };
  }, [autoPlay, autoSkip, ep, total, goNext]);

  useEffect(() => {
    setShowSkip(false); setNextBanner(false); setCountdown(5); clearInterval(countRef.current);
    setTimeout(() => epRef.current?.querySelector(".ep-active")?.scrollIntoView({ block:"nearest", behavior:"smooth" }), 100);
  }, [ep]);

  useEffect(() => { window.scrollTo({ top:0, behavior:"smooth" }); }, []);

  return (
    <div style={{ minHeight:"100vh", background:"#070b12", paddingTop:60 }}>
      {/* Breadcrumb */}
      <div style={{ padding:"10px 18px", borderBottom:"1px solid #0f1a2b", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
        <button onClick={onBack} style={{ background:"#0d1421", border:"1px solid #1e2d42", borderRadius:8, color:"#9ca3af", cursor:"pointer", padding:"6px 12px", display:"flex", alignItems:"center", gap:5, fontSize:13, fontWeight:600 }}>
          <Ic.ChevL/> Back
        </button>
        <span style={{ color:"#374151", fontSize:13 }}>{title}</span>
        <span style={{ color:"#1e2d42" }}>·</span>
        <span style={{ color:"#6b7280", fontSize:13 }}>Episode {ep}</span>
      </div>

      <div className="watch-layout">
        {/* LEFT */}
        <div className="watch-main">
          {/* PLAYER */}
          <div style={{ position:"relative", width:"100%", aspectRatio:"16/9", background:"#000", borderRadius:12, overflow:"hidden", boxShadow:"0 8px 40px rgba(0,0,0,.8)" }}>
            <iframe key={`${anime.mal_id}-${ep}-${lang}-${srv.id}`} src={embedUrl}
              title={`${title} Ep ${ep}`} allowFullScreen
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              style={{ width:"100%", height:"100%", border:"none", display:"block" }}/>

            {showSkip && (
              <button onClick={() => setShowSkip(false)}
                style={{ position:"absolute", bottom:70, right:16, background:"rgba(10,14,25,.88)", backdropFilter:"blur(8px)", border:"1px solid rgba(224,64,251,.4)", color:"#fff", borderRadius:8, padding:"9px 18px", cursor:"pointer", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:7, animation:"fadeUp .3s ease" }}>
                <Ic.Skip/> Skip Intro
              </button>
            )}

            {nextBanner && ep < total && (
              <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(to top,rgba(7,11,18,.98),rgba(7,11,18,.7))", padding:"18px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
                <div>
                  <div style={{ color:"#9ca3af", fontSize:12, marginBottom:2 }}>Up Next</div>
                  <div style={{ color:"#fff", fontWeight:700, fontSize:15 }}>Episode {ep+1}</div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => { setNextBanner(false); clearInterval(countRef.current); }} style={{ background:"#1e2d42", border:"none", color:"#9ca3af", borderRadius:8, padding:"8px 14px", cursor:"pointer", fontSize:13, fontWeight:600 }}>Cancel</button>
                  <button onClick={goNext} style={{ background:"#e040fb", border:"none", color:"#fff", borderRadius:8, padding:"8px 18px", cursor:"pointer", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:6 }}>
                    <Ic.Play s={14}/> Play ({countdown}s)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SERVER PICKER */}
          <div style={{ marginTop:14, background:"#0d1421", borderRadius:12, border:"1px solid #161f30", padding:"12px 16px" }}>
            <div style={{ color:"#6b7280", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Servers</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
              {SERVERS.map(s => (
                <button key={s.id} onClick={() => setSrv(s)} style={{
                  background: srv.id===s.id ? "linear-gradient(135deg,#e040fb,#7c4dff)" : "#111927",
                  border: `1px solid ${srv.id===s.id ? "#e040fb" : "#1e2d42"}`,
                  color: srv.id===s.id ? "#fff" : "#9ca3af",
                  borderRadius:8, padding:"8px 16px", cursor:"pointer", fontSize:12, fontWeight:700,
                  display:"flex", alignItems:"center", gap:6,
                  boxShadow: srv.id===s.id ? "0 4px 14px rgba(224,64,251,.3)" : "none", transition:"all .2s",
                }}>
                  {s.label}
                  <span style={{ fontSize:9, background: srv.id===s.id ? "rgba(255,255,255,.2)" : "#1e2d42", borderRadius:4, padding:"2px 5px" }}>{s.tag}</span>
                </button>
              ))}
            </div>
            <div style={{ marginTop:9, fontSize:11, color:"#374151" }}>💡 Video not loading? Try another server.</div>
          </div>

          {/* CONTROLS */}
          <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
            <button onClick={() => ep > 1 && setEp(e => e-1)} disabled={ep<=1}
              style={{ flex:1, minWidth:90, background:ep<=1?"#0a0f1a":"#0d1421", border:"1px solid #1e2d42", borderRadius:8, color:ep<=1?"#374151":"#9ca3af", padding:"9px 0", cursor:ep<=1?"default":"pointer", fontSize:13, fontWeight:600 }}>
              ← Prev
            </button>
            <button onClick={() => ep < total && setEp(e => e+1)} disabled={ep>=total}
              style={{ flex:1, minWidth:90, background:ep>=total?"#0a0f1a":"#0d1421", border:"1px solid #1e2d42", borderRadius:8, color:ep>=total?"#374151":"#9ca3af", padding:"9px 0", cursor:ep>=total?"default":"pointer", fontSize:13, fontWeight:600 }}>
              Next →
            </button>
            <div style={{ display:"flex", background:"#0d1421", border:"1px solid #1e2d42", borderRadius:8, overflow:"hidden" }}>
              {["sub","dub"].map(l => (
                <button key={l} onClick={() => setLang(l)}
                  style={{ background:lang===l?"#e040fb":"transparent", border:"none", color:lang===l?"#fff":"#6b7280", padding:"9px 16px", cursor:"pointer", fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:.5 }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* TOGGLES */}
          <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
            {[["Auto Play",autoPlay,setAutoPlay],["Auto Skip Intro",autoSkip,setAutoSkip]].map(([lbl,val,set]) => (
              <button key={lbl} onClick={() => set(v=>!v)}
                style={{ display:"flex", alignItems:"center", gap:7, background:"#0d1421", border:"1px solid #1e2d42", borderRadius:8, color:val?"#e040fb":"#6b7280", padding:"7px 14px", cursor:"pointer", fontSize:12, fontWeight:600 }}>
                <div style={{ width:28, height:16, borderRadius:8, background:val?"#e040fb":"#1e2d42", position:"relative", transition:"background .2s", flexShrink:0 }}>
                  <div style={{ position:"absolute", top:2, left:val?14:2, width:12, height:12, borderRadius:"50%", background:"#fff", transition:"left .2s" }}/>
                </div>
                {lbl}
              </button>
            ))}
          </div>

          {/* INFO */}
          <div style={{ marginTop:14, background:"#0d1421", borderRadius:12, border:"1px solid #161f30", padding:16 }}>
            <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
              {img && <img src={img} alt={title} style={{ width:70, height:96, objectFit:"cover", borderRadius:8, flexShrink:0 }}/>}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:"#6b7280", fontSize:12, marginBottom:3 }}>{anime.title}</div>
                <div style={{ color:"#f1f5f9", fontSize:16, fontWeight:800, marginBottom:8, lineHeight:1.2 }}>{title}</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:8 }}>
                  {genresOf(anime).slice(0,4).map(g => <span key={g} style={{ background:"#161f30", color:"#6b7280", fontSize:10, padding:"3px 8px", borderRadius:20 }}>{g}</span>)}
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center", fontSize:12 }}>
                  <span style={{ display:"flex", alignItems:"center", gap:4, color:"#fbbf24", fontWeight:700 }}><Ic.Star/>{scoreOf(anime)}</span>
                  <span style={{ color:"#374151" }}>·</span>
                  <span style={{ color:"#6b7280" }}>{anime.year}</span>
                  <span style={{ color:"#374151" }}>·</span>
                  <span style={{ color:anime.airing?"#10b981":"#6b7280", fontWeight:600 }}>{anime.airing?"Ongoing":"Completed"}</span>
                </div>
                <button onClick={() => onBookmark(anime.mal_id)}
                  style={{ marginTop:10, background:bookmarked?"rgba(224,64,251,.1)":"#161f30", border:`1px solid ${bookmarked?"rgba(224,64,251,.4)":"#1e2d42"}`, color:bookmarked?"#e040fb":"#9ca3af", borderRadius:8, padding:"6px 14px", cursor:"pointer", fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
                  <Ic.Bm on={bookmarked}/> {bookmarked ? "Saved" : "Save"}
                </button>
              </div>
            </div>
            {anime.synopsis && <p style={{ color:"#6b7280", fontSize:13, lineHeight:1.75, marginTop:14 }}>{anime.synopsis.slice(0,320)}…</p>}
          </div>
        </div>

        {/* RIGHT: Episode list */}
        <div className="watch-sidebar" ref={epRef}>
          <div style={{ background:"#0d1421", borderRadius:12, border:"1px solid #161f30", overflow:"hidden" }}>
            <div style={{ padding:"12px 14px", borderBottom:"1px solid #161f30", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#e2e8f0" }}>Episodes <span style={{ color:"#374151", fontWeight:400 }}>({total})</span></div>
              <button onClick={() => setEpGrid(v=>!v)} style={{ background:"#161f30", border:"1px solid #1e2d42", color:"#6b7280", borderRadius:6, padding:"4px 9px", cursor:"pointer", fontSize:11 }}>
                {epGrid ? "List" : "Grid"}
              </button>
            </div>
            <div style={{ maxHeight:460, overflowY:"auto", padding:8 }}>
              {epGrid ? (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:5 }}>
                  {eps.map(n => (
                    <button key={n} className={ep===n?"ep-active":""} onClick={() => setEp(n)}
                      style={{ background:ep===n?"#e040fb":"#111927", border:`1px solid ${ep===n?"#e040fb":"#1e2d42"}`, color:ep===n?"#fff":"#9ca3af", borderRadius:7, padding:"8px 4px", cursor:"pointer", fontSize:12, fontWeight:600, transition:"all .15s" }}>
                      {n}
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                  {eps.map(n => (
                    <button key={n} className={ep===n?"ep-active":""} onClick={() => setEp(n)}
                      style={{ background:ep===n?"#1a1f35":"transparent", border:`1px solid ${ep===n?"rgba(224,64,251,.35)":"transparent"}`, color:ep===n?"#e040fb":"#9ca3af", borderRadius:8, padding:"8px 12px", cursor:"pointer", fontSize:13, fontWeight:ep===n?700:400, textAlign:"left", width:"100%", display:"flex", alignItems:"center", gap:10, transition:"all .15s" }}>
                      <span style={{ width:26, height:26, borderRadius:6, flexShrink:0, background:ep===n?"#e040fb":"#1e2d42", color:ep===n?"#fff":"#6b7280", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700 }}>{n}</span>
                      Episode {n}
                      <span style={{ marginLeft:"auto", color:"#374151", fontSize:11 }}>24m</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DETAIL MODAL
═══════════════════════════════════════════════════════════ */
function AnimeModal({ anime, onClose, bookmarked, onBookmark, onWatch }) {
  useEffect(() => { document.body.style.overflow="hidden"; return () => { document.body.style.overflow=""; }; }, []);
  const title = titleOf(anime);
  const img   = imageOf(anime);
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.88)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(10px)" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#0a1020", borderRadius:20, width:"100%", maxWidth:820, maxHeight:"90vh", overflowY:"auto", border:"1px solid #1a2840", boxShadow:"0 30px 80px rgba(0,0,0,.85)", animation:"modalIn .25s ease" }}>
        {/* Banner */}
        <div style={{ position:"relative", height:220, overflow:"hidden", borderRadius:"20px 20px 0 0" }}>
          {img
            ? <img src={img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", filter:"blur(4px) brightness(.65)", transform:"scale(1.05)" }}/>
            : <div style={{ width:"100%", height:"100%", background:"linear-gradient(135deg,#1a0a2e,#0d1a35)" }}/>
          }
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,#0a1020 0%,transparent 55%)" }}/>
          {img && <img src={img} alt="" style={{ position:"absolute", left:"50%", top:"50%", transform:"translate(-50%,-50%)", height:"90%", objectFit:"contain", borderRadius:10, boxShadow:"0 8px 30px rgba(0,0,0,.6)" }}/>}
          <button onClick={onClose} style={{ position:"absolute", top:14, right:14, background:"rgba(0,0,0,.65)", border:"1px solid rgba(255,255,255,.1)", color:"#fff", cursor:"pointer", borderRadius:10, padding:8, display:"flex" }}>
            <Ic.X/>
          </button>
        </div>
        {/* Content */}
        <div style={{ padding:"16px 22px 22px" }}>
          <div style={{ color:"#6b7280", fontSize:12, marginBottom:4 }}>{anime.title}</div>
          <div style={{ color:"#f1f5f9", fontSize:20, fontWeight:800, marginBottom:10, lineHeight:1.2 }}>{title}</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:7, alignItems:"center", marginBottom:12 }}>
            <span style={{ display:"flex", alignItems:"center", gap:4, color:"#fbbf24", fontWeight:700, fontSize:13 }}><Ic.Star/>{scoreOf(anime)}</span>
            <span style={{ color:"#374151" }}>·</span>
            <span style={{ color:"#6b7280", fontSize:13 }}>{anime.year}</span>
            <span style={{ color:"#374151" }}>·</span>
            <span style={{ color:anime.airing?"#10b981":"#6b7280", fontSize:13, fontWeight:600 }}>{anime.airing?"Ongoing":"Completed"}</span>
            {anime.episodes && <><span style={{ color:"#374151" }}>·</span><span style={{ color:"#6b7280", fontSize:13 }}>{anime.episodes} eps</span></>}
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:14 }}>
            {genresOf(anime).map(g => <span key={g} style={{ background:"#161f30", color:"#6b7280", fontSize:11, padding:"3px 10px", borderRadius:20 }}>{g}</span>)}
          </div>
          {anime.synopsis && <p style={{ color:"#94a3b8", fontSize:14, lineHeight:1.75, marginBottom:18 }}>{anime.synopsis.slice(0,400)}…</p>}
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <button onClick={() => { onClose(); onWatch(anime,1); }}
              style={{ background:"linear-gradient(135deg,#e040fb,#7c4dff)", color:"#fff", border:"none", borderRadius:12, padding:"12px 26px", fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:8, boxShadow:"0 6px 22px rgba(224,64,251,.35)" }}>
              <Ic.Play s={16}/> Watch Now
            </button>
            <button onClick={() => onBookmark(anime.mal_id)}
              style={{ background:bookmarked?"rgba(224,64,251,.1)":"#161f30", border:`1px solid ${bookmarked?"rgba(224,64,251,.4)":"#1e2d42"}`, color:bookmarked?"#e040fb":"#9ca3af", borderRadius:12, padding:"12px 18px", fontWeight:600, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
              <Ic.Bm on={bookmarked}/> {bookmarked?"Saved":"Add to List"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   NAVBAR
═══════════════════════════════════════════════════════════ */
function Navbar({ navLinks, activeNav, setActiveNav, searchActive, setSearchActive, searchQuery, setSearchQuery, mobileMenu, setMobileMenu }) {
  const [profileOpen, setProfileOpen] = useState(false);
  return (
    <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, background:"rgba(7,11,18,.94)", backdropFilter:"blur(20px)", borderBottom:"1px solid #0f1a2b", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 18px", height:60, gap:12 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
        <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(135deg,#e040fb,#7c4dff)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 12px rgba(224,64,251,.45)", fontSize:15 }}>⚡</div>
        <span style={{ fontSize:17, fontWeight:900, background:"linear-gradient(135deg,#e040fb,#00e5ff)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>AniStream</span>
      </div>
      <div className="desk-nav">
        {navLinks.map(n => (
          <button key={n} onClick={() => setActiveNav(n)}
            style={{ background:"none", border:"none", cursor:"pointer", padding:"6px 13px", borderRadius:8, fontSize:13, fontWeight:activeNav===n?700:500, color:activeNav===n?"#e040fb":"#6b7280", borderBottom:`2px solid ${activeNav===n?"#e040fb":"transparent"}`, transition:"color .2s" }}>
            {n}
          </button>
        ))}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
        {searchActive ? (
          <div style={{ display:"flex", alignItems:"center", background:"#0d1421", borderRadius:10, padding:"6px 11px", gap:7, border:"1px solid #1e2d42" }}>
            <Ic.Search/>
            <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search any anime..."
              style={{ background:"none", border:"none", outline:"none", color:"#e2e8f0", fontSize:13, width:160 }}/>
            <button onClick={() => { setSearchActive(false); setSearchQuery(""); }} style={{ background:"none", border:"none", cursor:"pointer", color:"#374151", display:"flex" }}><Ic.X s={16}/></button>
          </div>
        ) : (
          <button onClick={() => setSearchActive(true)} style={{ background:"#0d1421", border:"1px solid #1e2d42", borderRadius:9, color:"#6b7280", padding:"7px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
            <Ic.Search/><span className="search-label" style={{ fontSize:13 }}>Search</span>
          </button>
        )}
        <div style={{ position:"relative" }}>
          <button onClick={() => setProfileOpen(v=>!v)} style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#e040fb,#7c4dff)", border:"none", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, cursor:"pointer", fontWeight:700, color:"#fff", flexShrink:0 }}>A</button>
          {profileOpen && (
            <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, background:"#0d1421", border:"1px solid #1e2d42", borderRadius:12, minWidth:175, padding:6, boxShadow:"0 16px 40px rgba(0,0,0,.7)", animation:"fadeUp .2s ease", zIndex:200 }}>
              <div style={{ padding:"10px 12px", borderBottom:"1px solid #161f30", marginBottom:4 }}>
                <div style={{ color:"#e2e8f0", fontSize:13, fontWeight:700 }}>AniStream User</div>
                <div style={{ color:"#6b7280", fontSize:11, marginTop:2 }}>Free Plan</div>
              </div>
              {["⚙️  Settings","🚪  Sign Out"].map(lbl => (
                <button key={lbl} onClick={() => setProfileOpen(false)} style={{ width:"100%", background:"none", border:"none", color:lbl.includes("Out")?"#ef4444":"#9ca3af", padding:"9px 12px", cursor:"pointer", fontSize:13, fontWeight:500, textAlign:"left", borderRadius:8 }}>
                  {lbl}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="hamburger" onClick={() => setMobileMenu(v=>!v)} style={{ background:"none", border:"none", color:"#9ca3af", cursor:"pointer", padding:4, display:"flex" }}>
          <Ic.Menu/>
        </button>
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════ */
export default function App() {
  const [list, setList]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [hasMore, setHasMore]     = useState(true);
  const [curPage, setCurPage]     = useState(1);
  const [activeNav, setActiveNav] = useState("Home");
  const [genre, setGenre]         = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [watchAnime, setWatchAnime] = useState(null);
  const [watchEp, setWatchEp]     = useState(1);
  const [bookmarks, setBookmarks] = useState(new Set());
  const [heroIdx, setHeroIdx]     = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const searchTimer = useRef(null);
  const navLinks    = ["Home","Trending","Schedule","Bookmarks"];

  const load = useCallback(async ({ page=1, q="", g="All", append=false }={}) => {
    try {
      const res = await fetchJikan({ page, search:q, genre:g });
      setList(prev => append ? [...prev, ...res.list] : res.list);
      setHasMore(res.hasMore);
      setCurPage(res.page);
    } catch (e) { console.error(e); }
  }, []);

  // Initial load
  useEffect(() => {
    setLoading(true);
    load({ page:1 }).finally(() => setLoading(false));
  }, [load]);

  // Genre switch
  useEffect(() => {
    setLoading(true);
    setHasMore(true);
    load({ page:1, q:searchQuery, g:genre }).finally(() => setLoading(false));
  }, [genre]); // eslint-disable-line

  // Debounced search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setLoading(true); setHasMore(true);
      load({ page:1, q:searchQuery, g:genre }).finally(() => setLoading(false));
    }, 600);
    return () => clearTimeout(searchTimer.current);
  }, [searchQuery]); // eslint-disable-line

  const loadMore = async () => {
    setMoreLoading(true);
    await load({ page:curPage+1, q:searchQuery, g:genre, append:true });
    setMoreLoading(false);
  };

  // Hero rotation
  useEffect(() => {
    if (!list.length) return;
    const t = setInterval(() => setHeroIdx(i => (i+1) % Math.min(6,list.length)), 7000);
    return () => clearInterval(t);
  }, [list.length]);

  const toggleBookmark = id => setBookmarks(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  const handleWatch    = (a, ep=1) => { setWatchAnime(a); setWatchEp(ep); setSelectedAnime(null); window.scrollTo({top:0}); };
  const heroAnime      = list[heroIdx];

  // WATCH VIEW
  if (watchAnime) return (
    <div style={{ background:"#070b12", minHeight:"100vh", color:"#e2e8f0" }}>
      <GlobalStyles/>
      <Navbar navLinks={navLinks} activeNav={activeNav} setActiveNav={n=>{setActiveNav(n);setWatchAnime(null);}}
        searchActive={searchActive} setSearchActive={setSearchActive}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        mobileMenu={mobileMenu} setMobileMenu={setMobileMenu}/>
      <WatchView anime={watchAnime} startEp={watchEp} onBack={()=>setWatchAnime(null)}
        bookmarked={bookmarks.has(watchAnime.mal_id)} onBookmark={toggleBookmark}/>
    </div>
  );

  // MAIN SITE
  return (
    <div style={{ minHeight:"100vh", background:"#070b12", color:"#e2e8f0", overflowX:"hidden" }}>
      <GlobalStyles/>
      <Navbar navLinks={navLinks} activeNav={activeNav} setActiveNav={setActiveNav}
        searchActive={searchActive} setSearchActive={setSearchActive}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        mobileMenu={mobileMenu} setMobileMenu={setMobileMenu}/>

      {mobileMenu && (
        <div style={{ position:"fixed", top:60, left:0, right:0, zIndex:90, background:"#0a1020", borderBottom:"1px solid #0f1a2b", padding:"10px 16px", display:"flex", flexDirection:"column", gap:3 }}>
          {navLinks.map(n => (
            <button key={n} onClick={() => { setActiveNav(n); setMobileMenu(false); }}
              style={{ background:activeNav===n?"#1a2840":"transparent", border:"none", color:activeNav===n?"#e040fb":"#9ca3af", padding:"11px 14px", borderRadius:10, cursor:"pointer", fontSize:15, fontWeight:600, textAlign:"left" }}>
              {n}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:14 }}>
          <div style={{ width:40, height:40, border:"3px solid #1e2d42", borderTop:"3px solid #e040fb", borderRadius:"50%", animation:"spin 1s linear infinite" }}/>
          <div style={{ color:"#374151", fontSize:14 }}>Loading anime from MyAnimeList...</div>
        </div>
      )}

      {!loading && (
        <>
          {/* HERO */}
          {activeNav==="Home" && heroAnime && !searchQuery && (
            <div style={{ position:"relative", height:"88vh", minHeight:480, overflow:"hidden" }}>
              <div key={heroIdx} style={{ position:"absolute", inset:0, animation:"heroIn .9s ease" }}>
                <img src={imageOf(heroAnime)} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", filter:"blur(2px)", transform:"scale(1.04)" }}/>
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right,rgba(7,11,18,.97) 28%,rgba(7,11,18,.55) 65%,rgba(7,11,18,.1) 100%)" }}/>
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,#070b12 0%,transparent 45%)" }}/>
              </div>
              <div className="hero-content" style={{ position:"relative", zIndex:2, height:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:"0 40px 80px", maxWidth:660, animation:"fadeUp .8s ease" }}>
                <div style={{ color:"#e040fb", fontSize:10, fontWeight:700, letterSpacing:3, textTransform:"uppercase", marginBottom:10 }}>⚡ Now Streaming</div>
                <div style={{ color:"#6b7280", fontSize:13, marginBottom:5 }}>{heroAnime.title}</div>
                <h1 className="hero-title" style={{ fontSize:46, fontWeight:900, lineHeight:1.08, marginBottom:12 }}>{titleOf(heroAnime)}</h1>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
                  {genresOf(heroAnime).slice(0,3).map(g => <span key={g} style={{ background:"rgba(224,64,251,.12)", border:"1px solid rgba(224,64,251,.28)", color:"#e040fb", fontSize:11, padding:"3px 10px", borderRadius:20, fontWeight:600 }}>{g}</span>)}
                  <span style={{ display:"flex", alignItems:"center", gap:3, background:"rgba(251,191,36,.1)", border:"1px solid rgba(251,191,36,.28)", color:"#fbbf24", fontSize:11, padding:"3px 10px", borderRadius:20, fontWeight:600 }}>
                    <Ic.Star/>{scoreOf(heroAnime)}
                  </span>
                </div>
                {heroAnime.synopsis && <p style={{ color:"#94a3b8", fontSize:14, lineHeight:1.75, marginBottom:26, maxWidth:440 }}>{heroAnime.synopsis.slice(0,200)}…</p>}
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  <button onClick={() => handleWatch(heroAnime,1)} style={{ background:"linear-gradient(135deg,#e040fb,#7c4dff)", color:"#fff", border:"none", borderRadius:12, padding:"12px 26px", fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:8, boxShadow:"0 8px 26px rgba(224,64,251,.4)" }}>
                    <Ic.Play s={16}/> Watch Now
                  </button>
                  <button onClick={() => setSelectedAnime(heroAnime)} style={{ background:"rgba(255,255,255,.06)", color:"#e2e8f0", border:"1px solid rgba(255,255,255,.14)", borderRadius:12, padding:"12px 20px", fontWeight:600, fontSize:14, cursor:"pointer", backdropFilter:"blur(10px)" }}>
                    More Info
                  </button>
                </div>
              </div>
              <div style={{ position:"absolute", bottom:24, left:40, display:"flex", gap:7, zIndex:2 }}>
                {list.slice(0,6).map((_,i) => <button key={i} onClick={() => setHeroIdx(i)} style={{ width:i===heroIdx?24:6, height:6, borderRadius:3, background:i===heroIdx?"#e040fb":"#1e2d42", border:"none", cursor:"pointer", transition:"all .3s", padding:0 }}/>)}
              </div>
            </div>
          )}

          <div style={{ padding:activeNav==="Home"?"0 18px 60px":"80px 18px 60px", maxWidth:1400, margin:"0 auto" }}>

            {/* HOME */}
            {activeNav==="Home" && (
              <>
                {searchQuery && <div style={{ marginBottom:14, marginTop:18, color:"#6b7280", fontSize:13 }}>Results for <strong style={{ color:"#e040fb" }}>"{searchQuery}"</strong> — {list.length} found</div>}
                <div className="main-layout">
                  <div style={{ flex:1, minWidth:0 }}>
                    {/* Genre pills */}
                    <div className="genre-scroll" style={{ marginBottom:20, marginTop:24 }}>
                      {ALL_GENRES.map(g => (
                        <button key={g} onClick={() => setGenre(g)}
                          style={{ background:genre===g?"#e040fb":"#0d1421", color:genre===g?"#fff":"#6b7280", border:genre===g?"1px solid #e040fb":"1px solid #1e2d42", borderRadius:20, padding:"6px 14px", fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", transition:"all .2s", boxShadow:genre===g?"0 4px 12px rgba(224,64,251,.28)":"none" }}>
                          {g}
                        </button>
                      ))}
                    </div>

                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                      <h2 style={{ fontSize:17, fontWeight:800 }}>
                        {searchQuery ? "Search Results" : genre!=="All" ? genre : "🔥 Most Popular"}
                      </h2>
                      <span style={{ color:"#374151", fontSize:12 }}>{list.length} titles</span>
                    </div>

                    <div className="anime-grid">
                      {list.map((a,i) => (
                        <div key={a.mal_id} style={{ animation:`fadeUp .35s ease ${Math.min(i*.04,.5)}s both` }}>
                          <AnimeCard a={a} onClick={setSelectedAnime} bookmarked={bookmarks.has(a.mal_id)} onBookmark={toggleBookmark}/>
                        </div>
                      ))}
                    </div>

                    {list.length===0 && !loading && (
                      <div style={{ textAlign:"center", padding:"60px 0" }}>
                        <div style={{ fontSize:36, marginBottom:10 }}>🔍</div>
                        <div style={{ fontSize:15, fontWeight:600, color:"#6b7280" }}>No anime found</div>
                        <div style={{ fontSize:13, color:"#374151", marginTop:6 }}>Try a different search term</div>
                      </div>
                    )}

                    {hasMore && list.length>0 && (
                      <div style={{ textAlign:"center", marginTop:30 }}>
                        <button onClick={loadMore} disabled={moreLoading}
                          style={{ background:moreLoading?"#0d1421":"linear-gradient(135deg,#e040fb,#7c4dff)", color:"#fff", border:moreLoading?"1px solid #1e2d42":"none", borderRadius:12, padding:"12px 36px", fontSize:14, fontWeight:700, cursor:moreLoading?"default":"pointer", opacity:moreLoading?.7:1, boxShadow:moreLoading?"none":"0 6px 20px rgba(224,64,251,.3)" }}>
                          {moreLoading ? "Loading..." : "Load More Anime"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Sidebar */}
                  <div className="sidebar">
                    <div style={{ background:"#0d1421", borderRadius:12, border:"1px solid #161f30", marginBottom:14, padding:"14px 0 8px" }}>
                      <div style={{ padding:"0 14px 8px", fontSize:13, fontWeight:700 }}>⭐ Top Rated</div>
                      {[...list].sort((a,b)=>(b.score||0)-(a.score||0)).slice(0,6).map(a => (
                        <div key={a.mal_id} onClick={() => setSelectedAnime(a)} style={{ display:"flex", gap:10, cursor:"pointer", padding:"8px 12px", alignItems:"center" }}>
                          {imageOf(a) && <img src={imageOf(a)} alt="" style={{ width:42, height:58, objectFit:"cover", borderRadius:6, flexShrink:0 }}/>}
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ color:"#d1d5db", fontSize:12, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{titleOf(a)}</div>
                            <div style={{ color:"#fbbf24", fontSize:10, marginTop:2, display:"flex", alignItems:"center", gap:3 }}><Ic.Star/>{scoreOf(a)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background:"#0d1421", borderRadius:12, border:"1px solid #161f30", padding:14 }}>
                      <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>📅 Airing Schedule</div>
                      {SCHEDULE.map(({day,shows}) => (
                        <div key={day} style={{ display:"flex", gap:10, marginBottom:8 }}>
                          <div style={{ width:30, color:"#e040fb", fontSize:11, fontWeight:700, paddingTop:2 }}>{day}</div>
                          <div>{shows.map(s => <div key={s} style={{ color:"#6b7280", fontSize:12, padding:"1px 0" }}>· {s}</div>)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* TRENDING */}
            {activeNav==="Trending" && (
              <div style={{ animation:"fadeUp .4s ease" }}>
                <h2 style={{ fontSize:24, fontWeight:900, marginBottom:6 }}>🔥 Trending Anime</h2>
                <p style={{ color:"#6b7280", marginBottom:22, fontSize:13 }}>{list.length} titles · sorted by popularity</p>
                <div className="anime-grid">
                  {list.map((a,i) => (
                    <div key={a.mal_id} style={{ animation:`fadeUp .35s ease ${Math.min(i*.04,.5)}s both` }}>
                      <AnimeCard a={a} onClick={setSelectedAnime} bookmarked={bookmarks.has(a.mal_id)} onBookmark={toggleBookmark}/>
                    </div>
                  ))}
                </div>
                {hasMore && (
                  <div style={{ textAlign:"center", marginTop:28 }}>
                    <button onClick={loadMore} disabled={moreLoading} style={{ background:"linear-gradient(135deg,#e040fb,#7c4dff)", color:"#fff", border:"none", borderRadius:12, padding:"12px 36px", fontSize:14, fontWeight:700, cursor:"pointer", opacity:moreLoading?.7:1 }}>
                      {moreLoading ? "Loading..." : "Load More"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SCHEDULE */}
            {activeNav==="Schedule" && (
              <div style={{ animation:"fadeUp .4s ease" }}>
                <h2 style={{ fontSize:24, fontWeight:900, marginBottom:6 }}>📅 Airing Schedule</h2>
                <p style={{ color:"#6b7280", marginBottom:22, fontSize:13 }}>This week's episodes</p>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))", gap:12 }}>
                  {SCHEDULE.map(({day,shows}) => (
                    <div key={day} style={{ background:"#0d1421", borderRadius:12, padding:16, border:"1px solid #161f30" }}>
                      <div style={{ color:"#e040fb", fontWeight:800, fontSize:15, marginBottom:12 }}>{day}</div>
                      {shows.map(s => <div key={s} style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 0", borderBottom:"1px solid #111927", color:"#94a3b8", fontSize:13 }}><div style={{ width:5,height:5,borderRadius:"50%",background:"#e040fb",flexShrink:0 }}/>{s}</div>)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BOOKMARKS */}
            {activeNav==="Bookmarks" && (
              <div style={{ animation:"fadeUp .4s ease" }}>
                <h2 style={{ fontSize:24, fontWeight:900, marginBottom:6 }}>🔖 My List</h2>
                <p style={{ color:"#6b7280", marginBottom:22, fontSize:13 }}>Saved anime ({bookmarks.size})</p>
                {bookmarks.size===0 ? (
                  <div style={{ textAlign:"center", padding:"80px 0", color:"#374151" }}>
                    <div style={{ fontSize:48, marginBottom:12 }}>🔖</div>
                    <div style={{ fontSize:16, fontWeight:700, color:"#6b7280", marginBottom:6 }}>Nothing saved yet</div>
                    <div style={{ fontSize:13 }}>Tap the bookmark on any anime</div>
                  </div>
                ) : (
                  <div className="anime-grid">
                    {list.filter(a=>bookmarks.has(a.mal_id)).map((a,i) => (
                      <div key={a.mal_id} style={{ animation:`fadeUp .35s ease ${i*.07}s both` }}>
                        <AnimeCard a={a} onClick={setSelectedAnime} bookmarked={true} onBookmark={toggleBookmark}/>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <footer style={{ borderTop:"1px solid #0f1a2b", padding:"28px 20px", textAlign:"center" }}>
            <div style={{ fontSize:18, fontWeight:900, background:"linear-gradient(135deg,#e040fb,#00e5ff)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:6 }}>AniStream</div>
            <div style={{ fontSize:11, color:"#1e2d42" }}>© 2026 AniStream · Data from MyAnimeList via Jikan API · For entertainment purposes only</div>
          </footer>
        </>
      )}

      {selectedAnime && (
        <AnimeModal anime={selectedAnime} onClose={() => setSelectedAnime(null)}
          bookmarked={bookmarks.has(selectedAnime.mal_id)} onBookmark={toggleBookmark}
          onWatch={handleWatch}/>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   GLOBAL STYLES
═══════════════════════════════════════════════════════════ */
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
      html,body{overflow-x:hidden;max-width:100%;background:#070b12;}
      body{font-family:'Outfit','Segoe UI',sans-serif;}
      ::-webkit-scrollbar{width:4px;height:4px;}
      ::-webkit-scrollbar-track{background:#070b12;}
      ::-webkit-scrollbar-thumb{background:#1e2d42;border-radius:2px;}
      ::-webkit-scrollbar-thumb:hover{background:#e040fb;}
      @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
      @keyframes heroIn{from{opacity:0;transform:scale(1.03);}to{opacity:1;transform:scale(1);}}
      @keyframes modalIn{from{opacity:0;transform:translateY(14px) scale(.97);}to{opacity:1;transform:translateY(0) scale(1);}}
      @keyframes spin{to{transform:rotate(360deg);}}
      .anime-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:14px;}
      .genre-scroll{display:flex;gap:7px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none;-ms-overflow-style:none;}
      .genre-scroll::-webkit-scrollbar{display:none;}
      .main-layout{display:flex;gap:22px;align-items:flex-start;}
      .sidebar{width:275px;flex-shrink:0;}
      .watch-layout{display:flex;gap:18px;padding:14px 18px 60px;max-width:1400px;margin:0 auto;}
      .watch-main{flex:1;min-width:0;}
      .watch-sidebar{width:290px;flex-shrink:0;position:sticky;top:72px;max-height:calc(100vh - 80px);overflow:hidden;}
      .desk-nav{display:flex;gap:2px;align-items:center;}
      .hamburger{display:none !important;}
      @media(max-width:860px){
        .anime-grid{grid-template-columns:repeat(auto-fill,minmax(110px,1fr)) !important;gap:10px !important;}
        .hero-content{padding:0 16px 36px !important;max-width:100% !important;}
        .hero-title{font-size:22px !important;}
        .main-layout{flex-direction:column !important;}
        .sidebar{width:100% !important;}
        .watch-layout{flex-direction:column !important;padding:10px 12px 40px !important;}
        .watch-sidebar{width:100% !important;position:static !important;max-height:none !important;}
        .desk-nav{display:none !important;}
        .hamburger{display:flex !important;}
        .search-label{display:none;}
      }
    `}</style>
  );
}
