import { useState, useEffect, useRef, useCallback } from "react";

/* ══════════════════════════════════════════════
   STORAGE HELPERS  (localStorage-based accounts)
══════════════════════════════════════════════ */
const S = {
  users    : () => JSON.parse(localStorage.getItem("ani_users")   || "[]"),
  session  : () => localStorage.getItem("ani_session"),
  history  : (uid) => JSON.parse(localStorage.getItem(`ani_hist_${uid}`) || "{}"),
  bookmarks: (uid) => JSON.parse(localStorage.getItem(`ani_bm_${uid}`)   || "[]"),
  saveUsers    : (v) => localStorage.setItem("ani_users",  JSON.stringify(v)),
  saveSession  : (id) => localStorage.setItem("ani_session", id),
  clearSession : () => localStorage.removeItem("ani_session"),
  saveHistory  : (uid, v) => localStorage.setItem(`ani_hist_${uid}`, JSON.stringify(v)),
  saveBookmarks: (uid, v) => localStorage.setItem(`ani_bm_${uid}`,   JSON.stringify(v)),
};
const uid = () => Math.random().toString(36).slice(2);

/* ══════════════════════════════════════════════
   APIs
══════════════════════════════════════════════ */
const JIKAN = "https://api.jikan.moe/v4";
const GENRE_IDS = {
  Action:1,Adventure:2,Comedy:4,Drama:8,Fantasy:10,Horror:14,
  Mystery:7,Romance:22,"Sci-Fi":24,"Slice of Life":36,
  Sports:30,Supernatural:37,Thriller:41,Psychological:40,Historical:13,Mecha:18,
};
const ALL_GENRES = ["All",...Object.keys(GENRE_IDS)];

const jikan = async (path) => {
  const r = await fetch(`${JIKAN}${path}`);
  return r.json();
};

const fetchAnime = async ({ page=1, search="", genre="All" }={}) => {
  let path;
  if (search.trim()) {
    path = `/anime?q=${encodeURIComponent(search)}&type=tv&limit=24&sfw=true&page=${page}&order_by=popularity&sort=asc`;
  } else if (genre !== "All" && GENRE_IDS[genre]) {
    path = `/anime?genres=${GENRE_IDS[genre]}&type=tv&order_by=score&sort=desc&limit=24&sfw=true&page=${page}`;
  } else {
    path = `/top/anime?type=tv&limit=24&page=${page}&filter=bypopularity`;
  }
  const d = await jikan(path);
  return { list: d.data||[], hasMore: d.pagination?.has_next_page||false, page: d.pagination?.current_page||page };
};

// Fetch a small row of anime for a specific section
const fetchRow = async (path) => {
  try { const d = await jikan(path); return d.data||[]; } catch { return []; }
};

// AniSkip — real intro/outro timestamps crowdsourced
const fetchSkipTimes = async (malId, ep) => {
  try {
    const r = await fetch(`https://api.aniskip.com/v2/skip-times/${malId}/${ep}?types[]=op&types[]=ed&episodeLength=0`);
    const d = await r.json();
    if (!d.found) return null;
    return {
      op: d.results.find(x => x.skipType === "op")?.interval || null,
      ed: d.results.find(x => x.skipType === "ed")?.interval || null,
    };
  } catch { return null; }
};

/* ══════════════════════════════════════════════
   SERVERS
══════════════════════════════════════════════ */
const SERVERS = [
  { id:"s1", label:"Server 1", tag:"HD",  url:(a,ep,lang)=>`https://megaplay.buzz/stream/mal/${a.mal_id}/${ep}/${lang}` },
  { id:"s2", label:"Server 2", tag:"HD",  url:(a,ep,lang)=>`https://megaplay.buzz/stream/ani/${a.mal_id}/${ep}/${lang}` },
  { id:"s3", label:"Server 3", tag:"ALT", url:(a,ep)=>`https://vidsrc.to/embed/anime/${a.mal_id}/${ep}` },
  { id:"s4", label:"Server 4", tag:"ALT", url:(a,ep)=>`https://vidsrc.xyz/embed/anime?id=${a.mal_id}&ep=${ep}` },
];

/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */
const titleOf  = (a) => a.title_english || a.title || "Unknown";
const imgOf    = (a) => a.images?.webp?.large_image_url || a.images?.jpg?.large_image_url;
const scoreOf  = (a) => a.score ? a.score.toFixed(1) : "N/A";
const genresOf = (a) => (a.genres||[]).map(g=>g.name);
const epCount  = (a) => Math.min(Number(a.episodes)||12, 200);
const epList   = (a) => Array.from({length:epCount(a)},(_,i)=>i+1);

const SCHEDULE = [
  {day:"Mon",shows:["One Piece","Bleach"]},{day:"Tue",shows:["Jujutsu Kaisen"]},
  {day:"Wed",shows:["Blue Lock","Solo Leveling"]},{day:"Thu",shows:["Frieren"]},
  {day:"Fri",shows:["Demon Slayer"]},{day:"Sat",shows:["Attack on Titan"]},
  {day:"Sun",shows:["Naruto","Dragon Ball Super"]},
];

/* ══════════════════════════════════════════════
   ICONS
══════════════════════════════════════════════ */
const Ic = {
  Star  : ()=><svg width="11" height="11" viewBox="0 0 24 24" fill="#fbbf24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  Play  : ({s=20})=><svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>,
  Search: ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  X     : ({s=18})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Bm    : ({on})=><svg width="14" height="14" viewBox="0 0 24 24" fill={on?"currentColor":"none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  ChevL : ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevR : ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Menu  : ()=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Skip  : ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,4 15,12 5,20"/><rect x="17" y="4" width="2" height="16"/></svg>,
  User  : ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Clock : ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

/* ══════════════════════════════════════════════
   AUTH MODAL
══════════════════════════════════════════════ */
function AuthModal({ onClose, onLogin }) {
  const [mode, setMode]   = useState("login"); // "login" | "signup"
  const [name, setName]   = useState("");
  const [pw, setPw]       = useState("");
  const [err, setErr]     = useState("");
  useEffect(()=>{document.body.style.overflow="hidden";return()=>{document.body.style.overflow="";};},[]);

  const submit = () => {
    setErr("");
    if (!name.trim()||!pw.trim()) return setErr("Fill in all fields.");
    const users = S.users();
    if (mode === "signup") {
      if (users.find(u=>u.name===name)) return setErr("Username already taken.");
      const newUser = { id:uid(), name, pw };
      S.saveUsers([...users, newUser]);
      S.saveSession(newUser.id);
      onLogin(newUser);
    } else {
      const found = users.find(u=>u.name===name && u.pw===pw);
      if (!found) return setErr("Wrong username or password.");
      S.saveSession(found.id);
      onLogin(found);
    }
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(12px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#13131a",borderRadius:18,width:"100%",maxWidth:400,border:"1px solid #252535",boxShadow:"0 30px 70px rgba(0,0,0,.8)",animation:"modalIn .22s ease"}}>
        {/* Tabs */}
        <div style={{display:"flex",borderBottom:"1px solid #252535"}}>
          {["login","signup"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setErr("");}} style={{flex:1,background:"none",border:"none",color:mode===m?"#a78bfa":"#6b7280",padding:"18px 0",fontSize:14,fontWeight:700,cursor:"pointer",borderBottom:mode===m?"2px solid #7c3aed":"2px solid transparent",transition:"color .2s",textTransform:"capitalize"}}>
              {m === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>
        <div style={{padding:"28px 28px 24px"}}>
          <div style={{fontSize:20,fontWeight:800,color:"#f1f5f9",marginBottom:6}}>
            {mode==="login"?"Welcome back 👋":"Join AniStream 🎌"}
          </div>
          <div style={{fontSize:13,color:"#6b7280",marginBottom:22}}>
            {mode==="login"?"Sign in to sync your watchlist and history.":"Create an account to save your progress and bookmarks."}
          </div>
          {[["Username",name,setName,"text"],["Password",pw,setPw,"password"]].map(([label,val,set,type])=>(
            <div key={label} style={{marginBottom:14}}>
              <label style={{display:"block",color:"#9ca3af",fontSize:12,fontWeight:600,marginBottom:6,textTransform:"uppercase",letterSpacing:.8}}>{label}</label>
              <input type={type} value={val} onChange={e=>set(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&submit()}
                placeholder={label}
                style={{width:"100%",background:"#0c0c14",border:"1px solid #252535",borderRadius:10,color:"#f1f5f9",padding:"11px 14px",fontSize:14,outline:"none"}}/>
            </div>
          ))}
          {err && <div style={{color:"#f87171",fontSize:12,marginBottom:12,background:"rgba(248,113,113,.1)",padding:"8px 12px",borderRadius:8}}>{err}</div>}
          <button onClick={submit} style={{width:"100%",background:"#7c3aed",border:"none",borderRadius:10,color:"#fff",padding:"12px 0",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 6px 20px rgba(124,58,237,.35)",marginBottom:14}}>
            {mode==="login"?"Sign In":"Create Account"}
          </button>
          <div style={{textAlign:"center",fontSize:12,color:"#374151"}}>
            🔒 All data is saved locally on your device only.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   ANIME CARD  (poster style)
══════════════════════════════════════════════ */
function AnimeCard({ a, onClick, bookmarked, onBookmark, progress }) {
  const [hov, setHov] = useState(false);
  const img = imgOf(a);

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{position:"relative",cursor:"pointer",borderRadius:10,overflow:"hidden",background:"#141420",flexShrink:0,
        transform:hov?"translateY(-4px)":"none", boxShadow:hov?"0 16px 40px rgba(0,0,0,.7), 0 0 0 1px #7c3aed40":"0 4px 16px rgba(0,0,0,.4)",
        transition:"transform .2s ease, box-shadow .2s ease"}}>

      {/* Poster */}
      <div onClick={()=>onClick(a)} style={{position:"relative",paddingBottom:"145%",overflow:"hidden"}}>
        {img
          ? <img src={img} alt={titleOf(a)} loading="lazy" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",transform:hov?"scale(1.05)":"scale(1)",transition:"transform .35s ease"}}/>
          : <div style={{position:"absolute",inset:0,background:"#1a1a2e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36}}>🎌</div>
        }
        {/* Gradient */}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(12,12,20,1) 0%,rgba(12,12,20,.2) 50%,transparent 100%)"}}/>
        {/* Status */}
        <div style={{position:"absolute",top:8,left:8,background:a.airing?"#059669":"#374151",color:"#fff",fontSize:9,fontWeight:700,padding:"3px 7px",borderRadius:20,textTransform:"uppercase",letterSpacing:.8}}>
          {a.airing?"Ongoing":"Done"}
        </div>
        {/* Bookmark */}
        <button onClick={e=>{e.stopPropagation();onBookmark&&onBookmark(a.mal_id);}} style={{position:"absolute",top:7,right:7,background:"rgba(0,0,0,.7)",border:"none",color:bookmarked?"#a78bfa":"#9ca3af",cursor:"pointer",borderRadius:7,padding:"5px 6px",display:"flex"}}>
          <Ic.Bm on={bookmarked}/>
        </button>
        {/* Play on hover */}
        {hov && (
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.15)"}}>
            <div onClick={()=>onClick(a)} style={{width:44,height:44,borderRadius:"50%",background:"#7c3aed",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 24px #7c3aed88"}}>
              <Ic.Play s={18}/>
            </div>
          </div>
        )}
        {/* Continue progress bar */}
        {progress > 0 && (
          <div style={{position:"absolute",bottom:0,left:0,right:0,height:3,background:"#252535"}}>
            <div style={{height:"100%",background:"#7c3aed",width:`${Math.min(progress,100)}%`}}/>
          </div>
        )}
      </div>

      {/* Info below card */}
      <div onClick={()=>onClick(a)} style={{padding:"8px 10px 10px"}}>
        <div style={{color:"#e2e8f0",fontSize:12,fontWeight:600,lineHeight:1.3,marginBottom:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
          {titleOf(a)}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <Ic.Star/>
          <span style={{color:"#fbbf24",fontSize:10,fontWeight:600}}>{scoreOf(a)}</span>
          <span style={{color:"#252535"}}>·</span>
          <span style={{color:"#4b5563",fontSize:10}}>{a.year||""}</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   HORIZONTAL ANIME ROW  (like Netflix)
══════════════════════════════════════════════ */
function AnimeRow({ title, list, onSelect, bookmarks, onBookmark, historyMap }) {
  const ref  = useRef(null);
  const scroll = (dir) => { ref.current.scrollBy({left:dir*320,behavior:"smooth"}); };
  if (!list?.length) return null;

  return (
    <div style={{marginBottom:36}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <h2 style={{fontSize:15,fontWeight:800,color:"#e2e8f0"}}>{title}</h2>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>scroll(-1)} style={arrowBtn}><Ic.ChevL/></button>
          <button onClick={()=>scroll(1)}  style={arrowBtn}><Ic.ChevR/></button>
        </div>
      </div>
      <div ref={ref} style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:4,scrollbarWidth:"none"}} className="hide-scroll">
        {list.map(a => {
          const h = historyMap?.[a.mal_id];
          const progress = h?.ep && a.episodes ? (h.ep/a.episodes)*100 : 0;
          return (
            <div key={a.mal_id} style={{width:148,flexShrink:0}}>
              <AnimeCard a={a} onClick={onSelect} bookmarked={bookmarks?.has(a.mal_id)} onBookmark={onBookmark} progress={progress}/>
            </div>
          );
        })}
      </div>
    </div>
  );
}
const arrowBtn = {background:"#141420",border:"1px solid #252535",color:"#9ca3af",borderRadius:7,padding:"5px 7px",cursor:"pointer",display:"flex",alignItems:"center"};

/* ══════════════════════════════════════════════
   CONTINUE WATCHING ROW
══════════════════════════════════════════════ */
function ContinueRow({ history, bookmarks, onWatch, onSelect, onBookmark }) {
  const ref   = useRef(null);
  const items = Object.values(history).sort((a,b)=>b.updatedAt-a.updatedAt).slice(0,20);
  if (!items.length) return null;
  const scroll = (d) => ref.current.scrollBy({left:d*340,behavior:"smooth"});

  return (
    <div style={{marginBottom:36}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <h2 style={{fontSize:15,fontWeight:800,color:"#e2e8f0",display:"flex",alignItems:"center",gap:7}}><Ic.Clock/> Continue Watching</h2>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>scroll(-1)} style={arrowBtn}><Ic.ChevL/></button>
          <button onClick={()=>scroll(1)}  style={arrowBtn}><Ic.ChevR/></button>
        </div>
      </div>
      <div ref={ref} style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:4,scrollbarWidth:"none"}} className="hide-scroll">
        {items.map(h => {
          const a = h.anime;
          const img = imgOf(a);
          const progress = a.episodes ? (h.ep/a.episodes)*100 : 50;
          return (
            <div key={a.mal_id} style={{width:240,flexShrink:0,background:"#141420",borderRadius:10,overflow:"hidden",cursor:"pointer",border:"1px solid #252535"}} onClick={()=>onWatch(a,h.ep)}>
              <div style={{position:"relative",paddingBottom:"56%",overflow:"hidden"}}>
                {img
                  ? <img src={img} alt="" loading="lazy" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",filter:"brightness(.8)"}}/>
                  : <div style={{position:"absolute",inset:0,background:"#1a1a2e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>🎌</div>
                }
                <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(12,12,20,.9) 0%,transparent 60%)"}}/>
                <div style={{position:"absolute",bottom:8,left:10,right:10,display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:"#7c3aed",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 16px #7c3aed66"}}><Ic.Play s={14}/></div>
                  <div>
                    <div style={{color:"#fff",fontSize:12,fontWeight:700,lineHeight:1.2}}>{titleOf(a)}</div>
                    <div style={{color:"#9ca3af",fontSize:10,marginTop:2}}>Episode {h.ep}</div>
                  </div>
                </div>
                {/* Progress */}
                <div style={{position:"absolute",bottom:0,left:0,right:0,height:3,background:"#252535"}}>
                  <div style={{height:"100%",background:"#7c3aed",width:`${Math.min(progress,100)}%`}}/>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   WATCH VIEW
══════════════════════════════════════════════ */
function WatchView({ anime, startEp, onBack, bookmarked, onBookmark, onSaveHistory }) {
  const [ep, setEp]               = useState(startEp);
  const [lang, setLang]           = useState("sub");
  const [srv, setSrv]             = useState(SERVERS[0]);
  const [autoPlay, setAutoPlay]   = useState(true);
  const [autoSkip, setAutoSkip]   = useState(true);
  const [skipTimes, setSkipTimes] = useState(null);
  const [localSec, setLocalSec]   = useState(0);
  const [showSkip, setShowSkip]   = useState(false);  // intro skip button
  const [showEd, setShowEd]       = useState(false);   // outro skip button
  const [epGrid, setEpGrid]       = useState(true);
  const [nextBanner, setNextBanner] = useState(false);
  const [countdown, setCountdown]   = useState(5);
  const iframeRef  = useRef(null);
  const timerRef   = useRef(null);
  const countRef   = useRef(null);
  const epRef      = useRef(null);
  const eps        = epList(anime);
  const total      = eps.length;
  const title      = titleOf(anime);
  const img        = imgOf(anime);

  // Fetch real skip times from AniSkip API
  useEffect(() => {
    setSkipTimes(null);
    setShowSkip(false);
    setShowEd(false);
    fetchSkipTimes(anime.mal_id, ep).then(setSkipTimes);
  }, [anime.mal_id, ep]);

  // Local timer — ticks every second to track playback position
  // (since we can't reliably get time events from the iframe)
  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    setLocalSec(0);
    timerRef.current = setInterval(() => setLocalSec(s => s + 1), 1000);
  }, []);

  useEffect(() => () => clearInterval(timerRef.current), []);

  // Show skip buttons based on local timer vs AniSkip times
  useEffect(() => {
    if (!skipTimes) return;
    const { op, ed } = skipTimes;
    if (op) setShowSkip(localSec >= op.startTime && localSec <= op.endTime);
    if (ed) setShowEd(localSec >= ed.startTime && localSec <= ed.endTime);
  }, [localSec, skipTimes]);

  // Auto-skip intro
  useEffect(() => {
    if (autoSkip && showSkip && skipTimes?.op) handleSkip("op");
  }, [showSkip]); // eslint-disable-line

  // postMessage from megaplay (episode complete)
  useEffect(() => {
    const h = (e) => {
      try {
        const d = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (!d) return;
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
  }, [autoPlay, ep, total]); // eslint-disable-line

  // Skip to a point by reloading the iframe with ?start= param
  const handleSkip = (type) => {
    const time = type === "op" ? skipTimes?.op?.endTime : skipTimes?.ed?.endTime;
    if (!time || !iframeRef.current) { setShowSkip(false); setShowEd(false); return; }
    const currentSrc = srv.url(anime, ep, lang);
    iframeRef.current.src = `${currentSrc}?start=${Math.floor(time)}`;
    setLocalSec(Math.floor(time));
    setShowSkip(false); setShowEd(false);
  };

  const goNext = useCallback(() => {
    if (ep < total) { setEp(e=>e+1); setNextBanner(false); setCountdown(5); clearInterval(countRef.current); }
  }, [ep, total]);

  useEffect(() => {
    setShowSkip(false); setShowEd(false); setNextBanner(false); setCountdown(5);
    clearInterval(countRef.current);
    onSaveHistory?.(anime, ep);
    setTimeout(() => epRef.current?.querySelector(".ep-active")?.scrollIntoView({block:"nearest",behavior:"smooth"}), 100);
  }, [ep]); // eslint-disable-line

  useEffect(() => { window.scrollTo({top:0,behavior:"smooth"}); }, []);

  const embedUrl = srv.url(anime, ep, lang);

  return (
    <div style={{minHeight:"100vh",background:"#0c0c12",paddingTop:60}}>
      {/* Breadcrumb */}
      <div style={{padding:"10px 18px",borderBottom:"1px solid #1a1a28",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <button onClick={onBack} style={{background:"#141420",border:"1px solid #252535",borderRadius:8,color:"#9ca3af",cursor:"pointer",padding:"6px 12px",display:"flex",alignItems:"center",gap:5,fontSize:13,fontWeight:600}}>
          <Ic.ChevL/> Back
        </button>
        <span style={{color:"#4b5563",fontSize:13}}>{title}</span>
        <span style={{color:"#252535"}}>·</span>
        <span style={{color:"#6b7280",fontSize:13}}>Episode {ep}</span>
        {skipTimes?.op && <span style={{marginLeft:"auto",background:"rgba(124,58,237,.15)",border:"1px solid rgba(124,58,237,.3)",color:"#a78bfa",fontSize:11,padding:"3px 9px",borderRadius:20,fontWeight:600}}>⏱ Skip times detected</span>}
      </div>

      <div className="watch-layout">
        {/* LEFT */}
        <div className="watch-main">
          {/* PLAYER */}
          <div style={{position:"relative",width:"100%",aspectRatio:"16/9",background:"#000",borderRadius:10,overflow:"hidden",boxShadow:"0 8px 40px rgba(0,0,0,.9)"}}>
            <iframe
              ref={iframeRef}
              key={`${anime.mal_id}-${ep}-${lang}-${srv.id}`}
              src={embedUrl}
              title={`${title} Ep ${ep}`}
              allowFullScreen
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              onLoad={startTimer}
              style={{width:"100%",height:"100%",border:"none",display:"block"}}
            />

            {/* Skip Intro button — appears when intro is detected */}
            {showSkip && !autoSkip && (
              <button onClick={()=>handleSkip("op")} style={{position:"absolute",bottom:70,right:16,background:"rgba(12,12,18,.92)",backdropFilter:"blur(10px)",border:"1px solid #7c3aed",color:"#fff",borderRadius:8,padding:"10px 20px",cursor:"pointer",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:7,animation:"fadeUp .3s ease",boxShadow:"0 4px 20px rgba(0,0,0,.6)"}}>
                <Ic.Skip/> Skip Intro
              </button>
            )}

            {/* Skip Outro button */}
            {showEd && (
              <button onClick={()=>handleSkip("ed")} style={{position:"absolute",bottom:70,right:16,background:"rgba(12,12,18,.92)",backdropFilter:"blur(10px)",border:"1px solid #7c3aed",color:"#fff",borderRadius:8,padding:"10px 20px",cursor:"pointer",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:7,animation:"fadeUp .3s ease",boxShadow:"0 4px 20px rgba(0,0,0,.6)"}}>
                <Ic.Skip/> Skip Outro
              </button>
            )}

            {/* Auto next banner */}
            {nextBanner && ep < total && (
              <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(to top,rgba(12,12,18,.98),rgba(12,12,18,.7))",padding:"20px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
                <div>
                  <div style={{color:"#9ca3af",fontSize:12,marginBottom:2}}>Up Next</div>
                  <div style={{color:"#fff",fontWeight:700,fontSize:15}}>Episode {ep+1}</div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>{setNextBanner(false);clearInterval(countRef.current);}} style={{background:"#1a1a28",border:"1px solid #252535",color:"#9ca3af",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13,fontWeight:600}}>Cancel</button>
                  <button onClick={goNext} style={{background:"#7c3aed",border:"none",color:"#fff",borderRadius:8,padding:"8px 18px",cursor:"pointer",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:6,boxShadow:"0 4px 16px rgba(124,58,237,.4)"}}>
                    <Ic.Play s={14}/> Play ({countdown}s)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SERVERS */}
          <div style={{marginTop:14,background:"#141420",borderRadius:10,border:"1px solid #1a1a28",padding:"12px 14px"}}>
            <div style={{color:"#4b5563",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Servers</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
              {SERVERS.map(s=>(
                <button key={s.id} onClick={()=>setSrv(s)} style={{background:srv.id===s.id?"#7c3aed":"#0c0c14",border:`1px solid ${srv.id===s.id?"#7c3aed":"#252535"}`,color:srv.id===s.id?"#fff":"#9ca3af",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:5,transition:"all .18s"}}>
                  {s.label} <span style={{fontSize:9,background:srv.id===s.id?"rgba(255,255,255,.2)":"#252535",borderRadius:4,padding:"2px 4px"}}>{s.tag}</span>
                </button>
              ))}
            </div>
            <div style={{marginTop:9,fontSize:11,color:"#374151"}}>💡 If video doesn't load, try another server.</div>
          </div>

          {/* CONTROLS */}
          <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
            <button onClick={()=>ep>1&&setEp(e=>e-1)} disabled={ep<=1} style={{flex:1,minWidth:90,background:ep<=1?"#0c0c14":"#141420",border:"1px solid #1a1a28",borderRadius:8,color:ep<=1?"#374151":"#9ca3af",padding:"9px 0",cursor:ep<=1?"default":"pointer",fontSize:13,fontWeight:600}}>← Prev</button>
            <button onClick={()=>ep<total&&setEp(e=>e+1)} disabled={ep>=total} style={{flex:1,minWidth:90,background:ep>=total?"#0c0c14":"#141420",border:"1px solid #1a1a28",borderRadius:8,color:ep>=total?"#374151":"#9ca3af",padding:"9px 0",cursor:ep>=total?"default":"pointer",fontSize:13,fontWeight:600}}>Next →</button>
            <div style={{display:"flex",background:"#141420",border:"1px solid #1a1a28",borderRadius:8,overflow:"hidden"}}>
              {["sub","dub"].map(l=>(
                <button key={l} onClick={()=>setLang(l)} style={{background:lang===l?"#7c3aed":"transparent",border:"none",color:lang===l?"#fff":"#6b7280",padding:"9px 16px",cursor:"pointer",fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* TOGGLES */}
          <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
            {[["Auto Play Next",autoPlay,setAutoPlay],["Auto Skip Intro",autoSkip,setAutoSkip]].map(([lbl,val,set])=>(
              <button key={lbl} onClick={()=>set(v=>!v)} style={{display:"flex",alignItems:"center",gap:7,background:"#141420",border:"1px solid #1a1a28",borderRadius:8,color:val?"#a78bfa":"#6b7280",padding:"7px 13px",cursor:"pointer",fontSize:12,fontWeight:600}}>
                <div style={{width:28,height:16,borderRadius:8,background:val?"#7c3aed":"#252535",position:"relative",transition:"background .2s",flexShrink:0}}>
                  <div style={{position:"absolute",top:2,left:val?14:2,width:12,height:12,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
                </div>
                {lbl}
              </button>
            ))}
          </div>

          {/* ANIME INFO */}
          <div style={{marginTop:14,background:"#141420",borderRadius:10,border:"1px solid #1a1a28",padding:16}}>
            <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
              {img&&<img src={img} alt={title} style={{width:68,height:96,objectFit:"cover",borderRadius:8,flexShrink:0}}/>}
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:"#6b7280",fontSize:11,marginBottom:3}}>{anime.title}</div>
                <div style={{color:"#f1f5f9",fontSize:16,fontWeight:800,marginBottom:8,lineHeight:1.2}}>{title}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
                  {genresOf(anime).slice(0,4).map(g=><span key={g} style={{background:"#1a1a28",color:"#6b7280",fontSize:10,padding:"3px 8px",borderRadius:20}}>{g}</span>)}
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",fontSize:12}}>
                  <span style={{display:"flex",alignItems:"center",gap:4,color:"#fbbf24",fontWeight:700}}><Ic.Star/>{scoreOf(anime)}</span>
                  <span style={{color:"#252535"}}>·</span>
                  <span style={{color:"#6b7280"}}>{anime.year}</span>
                  <span style={{color:"#252535"}}>·</span>
                  <span style={{color:anime.airing?"#10b981":"#6b7280",fontWeight:600}}>{anime.airing?"Ongoing":"Completed"}</span>
                </div>
                <button onClick={()=>onBookmark(anime.mal_id)} style={{marginTop:10,background:bookmarked?"rgba(124,58,237,.15)":"#1a1a28",border:`1px solid ${bookmarked?"#7c3aed60":"#252535"}`,color:bookmarked?"#a78bfa":"#9ca3af",borderRadius:8,padding:"6px 13px",cursor:"pointer",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
                  <Ic.Bm on={bookmarked}/> {bookmarked?"Saved":"Save"}
                </button>
              </div>
            </div>
            {anime.synopsis&&<p style={{color:"#6b7280",fontSize:13,lineHeight:1.75,marginTop:14}}>{anime.synopsis.slice(0,320)}…</p>}
          </div>
        </div>

        {/* RIGHT: Episode list */}
        <div className="watch-sidebar" ref={epRef}>
          <div style={{background:"#141420",borderRadius:10,border:"1px solid #1a1a28",overflow:"hidden"}}>
            <div style={{padding:"12px 14px",borderBottom:"1px solid #1a1a28",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0"}}>Episodes <span style={{color:"#374151",fontWeight:400}}>({total})</span></div>
              <button onClick={()=>setEpGrid(v=>!v)} style={{background:"#1a1a28",border:"1px solid #252535",color:"#6b7280",borderRadius:6,padding:"4px 9px",cursor:"pointer",fontSize:11}}>
                {epGrid?"List":"Grid"}
              </button>
            </div>
            <div style={{maxHeight:460,overflowY:"auto",padding:8}}>
              {epGrid ? (
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5}}>
                  {eps.map(n=>(
                    <button key={n} className={ep===n?"ep-active":""} onClick={()=>setEp(n)} style={{background:ep===n?"#7c3aed":"#0c0c14",border:`1px solid ${ep===n?"#7c3aed":"#1a1a28"}`,color:ep===n?"#fff":"#9ca3af",borderRadius:7,padding:"8px 4px",cursor:"pointer",fontSize:12,fontWeight:600,transition:"all .15s"}}>
                      {n}
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:2}}>
                  {eps.map(n=>(
                    <button key={n} className={ep===n?"ep-active":""} onClick={()=>setEp(n)} style={{background:ep===n?"#1a1430":"transparent",border:`1px solid ${ep===n?"rgba(124,58,237,.35)":"transparent"}`,color:ep===n?"#a78bfa":"#9ca3af",borderRadius:8,padding:"8px 12px",cursor:"pointer",fontSize:13,fontWeight:ep===n?700:400,textAlign:"left",width:"100%",display:"flex",alignItems:"center",gap:10,transition:"all .15s"}}>
                      <span style={{width:26,height:26,borderRadius:6,flexShrink:0,background:ep===n?"#7c3aed":"#1a1a28",color:ep===n?"#fff":"#6b7280",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700}}>{n}</span>
                      Episode {n}
                      <span style={{marginLeft:"auto",color:"#374151",fontSize:11}}>24m</span>
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

/* ══════════════════════════════════════════════
   DETAIL MODAL
══════════════════════════════════════════════ */
function AnimeModal({ anime, onClose, bookmarked, onBookmark, onWatch }) {
  useEffect(()=>{document.body.style.overflow="hidden";return()=>{document.body.style.overflow="";};} ,[]);
  const img = imgOf(anime);
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(12px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#13131a",borderRadius:18,width:"100%",maxWidth:820,maxHeight:"90vh",overflowY:"auto",border:"1px solid #252535",boxShadow:"0 30px 80px rgba(0,0,0,.85)",animation:"modalIn .22s ease"}}>
        {/* Banner */}
        <div style={{position:"relative",height:210,overflow:"hidden",borderRadius:"18px 18px 0 0"}}>
          {img
            ? <img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover",filter:"blur(5px) brightness(.55)",transform:"scale(1.06)"}}/>
            : <div style={{width:"100%",height:"100%",background:"linear-gradient(135deg,#1a0a2e,#0d1a35)"}}/>
          }
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,#13131a 0%,transparent 60%)"}}/>
          {img&&<img src={img} alt="" style={{position:"absolute",left:28,bottom:-20,height:"85%",objectFit:"contain",borderRadius:10,boxShadow:"0 12px 40px rgba(0,0,0,.7)"}}/>}
          <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"rgba(0,0,0,.7)",border:"1px solid rgba(255,255,255,.1)",color:"#fff",cursor:"pointer",borderRadius:10,padding:8,display:"flex"}}>
            <Ic.X/>
          </button>
        </div>
        <div style={{padding:"32px 24px 24px"}}>
          <div style={{color:"#6b7280",fontSize:12,marginBottom:3}}>{anime.title}</div>
          <div style={{color:"#f1f5f9",fontSize:20,fontWeight:800,marginBottom:10,lineHeight:1.2}}>{titleOf(anime)}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:7,alignItems:"center",marginBottom:12}}>
            <span style={{display:"flex",alignItems:"center",gap:4,color:"#fbbf24",fontWeight:700,fontSize:13}}><Ic.Star/>{scoreOf(anime)}</span>
            <span style={{color:"#252535"}}>·</span>
            <span style={{color:"#6b7280",fontSize:13}}>{anime.year}</span>
            <span style={{color:"#252535"}}>·</span>
            <span style={{color:anime.airing?"#10b981":"#6b7280",fontSize:13,fontWeight:600}}>{anime.airing?"Ongoing":"Completed"}</span>
            {anime.episodes&&<><span style={{color:"#252535"}}>·</span><span style={{color:"#6b7280",fontSize:13}}>{anime.episodes} eps</span></>}
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:14}}>
            {genresOf(anime).map(g=><span key={g} style={{background:"#1a1a28",color:"#6b7280",fontSize:11,padding:"3px 10px",borderRadius:20}}>{g}</span>)}
          </div>
          {anime.synopsis&&<p style={{color:"#9ca3af",fontSize:14,lineHeight:1.75,marginBottom:18}}>{anime.synopsis.slice(0,400)}…</p>}
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <button onClick={()=>{onClose();onWatch(anime,1);}} style={{background:"#7c3aed",color:"#fff",border:"none",borderRadius:12,padding:"12px 28px",fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:8,boxShadow:"0 6px 20px rgba(124,58,237,.4)"}}>
              <Ic.Play s={16}/> Watch Now
            </button>
            <button onClick={()=>onBookmark(anime.mal_id)} style={{background:bookmarked?"rgba(124,58,237,.15)":"#1a1a28",border:`1px solid ${bookmarked?"#7c3aed60":"#252535"}`,color:bookmarked?"#a78bfa":"#9ca3af",borderRadius:12,padding:"12px 18px",fontWeight:600,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
              <Ic.Bm on={bookmarked}/> {bookmarked?"Saved":"Add to List"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   NAVBAR
══════════════════════════════════════════════ */
function Navbar({ nav, setNav, onSearch, searchQ, user, onAuthOpen, onLogout, mobileOpen, setMobileOpen }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const navLinks = ["Home","Browse","Schedule","Bookmarks"];

  return (
    <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,background:"rgba(12,12,18,.96)",backdropFilter:"blur(20px)",borderBottom:"1px solid #1a1a28",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",height:60,gap:14}}>
      {/* Logo */}
      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
        <div style={{width:30,height:30,borderRadius:8,background:"#7c3aed",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 14px rgba(124,58,237,.5)",fontSize:15}}>⚡</div>
        <span style={{fontSize:17,fontWeight:900,color:"#f1f5f9",letterSpacing:-.3}}>AniStream</span>
      </div>

      {/* Desktop nav */}
      <div className="desk-nav">
        {navLinks.map(n=>(
          <button key={n} onClick={()=>setNav(n)} style={{background:"none",border:"none",cursor:"pointer",padding:"6px 14px",borderRadius:8,fontSize:13,fontWeight:nav===n?700:500,color:nav===n?"#f1f5f9":"#6b7280",position:"relative",transition:"color .2s"}}>
            {n}
            {nav===n&&<div style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",width:18,height:2,borderRadius:2,background:"#7c3aed"}}/>}
          </button>
        ))}
      </div>

      {/* Right */}
      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
        {/* Search */}
        {searchOpen ? (
          <div style={{display:"flex",alignItems:"center",background:"#141420",borderRadius:10,padding:"6px 11px",gap:7,border:"1px solid #252535"}}>
            <Ic.Search/>
            <input autoFocus value={searchQ} onChange={e=>onSearch(e.target.value)} placeholder="Search anime..."
              style={{background:"none",border:"none",outline:"none",color:"#f1f5f9",fontSize:13,width:160}}/>
            <button onClick={()=>{setSearchOpen(false);onSearch("");}} style={{background:"none",border:"none",cursor:"pointer",color:"#374151",display:"flex"}}><Ic.X s={15}/></button>
          </div>
        ):(
          <button onClick={()=>setSearchOpen(true)} style={{background:"#141420",border:"1px solid #252535",borderRadius:9,color:"#6b7280",padding:"7px 11px",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
            <Ic.Search/><span className="search-label" style={{fontSize:13}}>Search</span>
          </button>
        )}

        {/* Auth / Profile */}
        {user ? (
          <div style={{position:"relative"}}>
            <button onClick={()=>setProfileOpen(v=>!v)} style={{display:"flex",alignItems:"center",gap:7,background:"#141420",border:"1px solid #252535",borderRadius:9,padding:"5px 10px 5px 6px",cursor:"pointer"}}>
              <div style={{width:26,height:26,borderRadius:"50%",background:"#7c3aed",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff"}}>
                {user.name[0].toUpperCase()}
              </div>
              <span style={{color:"#e2e8f0",fontSize:13,fontWeight:600}}>{user.name}</span>
            </button>
            {profileOpen && (
              <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,background:"#141420",border:"1px solid #252535",borderRadius:12,minWidth:180,padding:6,boxShadow:"0 16px 40px rgba(0,0,0,.8)",animation:"fadeUp .2s ease",zIndex:200}}>
                <div style={{padding:"10px 12px",borderBottom:"1px solid #1a1a28",marginBottom:4}}>
                  <div style={{color:"#f1f5f9",fontSize:13,fontWeight:700}}>{user.name}</div>
                  <div style={{color:"#6b7280",fontSize:11,marginTop:2}}>Free Plan · Local Account</div>
                </div>
                <button onClick={()=>{setProfileOpen(false);setNav("Bookmarks");}} style={{width:"100%",background:"none",border:"none",color:"#9ca3af",padding:"9px 12px",cursor:"pointer",fontSize:13,textAlign:"left",borderRadius:8}}>🔖 My Bookmarks</button>
                <button onClick={()=>{setProfileOpen(false);onLogout();}} style={{width:"100%",background:"none",border:"none",color:"#ef4444",padding:"9px 12px",cursor:"pointer",fontSize:13,textAlign:"left",borderRadius:8}}>🚪 Sign Out</button>
              </div>
            )}
          </div>
        ) : (
          <button onClick={onAuthOpen} style={{background:"#7c3aed",border:"none",borderRadius:9,color:"#fff",padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:6,boxShadow:"0 4px 14px rgba(124,58,237,.35)"}}>
            <Ic.User/> Sign In
          </button>
        )}

        <button className="hamburger" onClick={()=>setMobileOpen(v=>!v)} style={{background:"none",border:"none",color:"#9ca3af",cursor:"pointer",padding:4,display:"flex"}}>
          <Ic.Menu/>
        </button>
      </div>
    </nav>
  );
}

/* ══════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════ */
export default function App() {
  const [user, setUser]       = useState(null);
  const [history, setHistory] = useState({});
  const [bookmarks, setBookmarks] = useState(new Set());
  const [showAuth, setShowAuth] = useState(false);

  const [trending,   setTrending]   = useState([]);
  const [topRated,   setTopRated]   = useState([]);
  const [ongoing,    setOngoing]    = useState([]);
  const [browseList, setBrowseList] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [moreLoading,setMoreLoading]= useState(false);
  const [hasMore,    setHasMore]    = useState(true);
  const [curPage,    setCurPage]    = useState(1);

  const [nav,    setNav]    = useState("Home");
  const [genre,  setGenre]  = useState("All");
  const [searchQ,setSearchQ]= useState("");
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [watchAnime, setWatchAnime] = useState(null);
  const [watchEp, setWatchEp] = useState(1);
  const [heroIdx, setHeroIdx] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const searchTimer = useRef(null);
  const navLinks = ["Home","Browse","Schedule","Bookmarks"];

  /* ── Auth ── */
  useEffect(() => {
    const sid = S.session();
    if (!sid) return;
    const found = S.users().find(u=>u.id===sid);
    if (found) loadUser(found);
  }, []);

  const loadUser = (u) => {
    setUser(u);
    setHistory(S.history(u.id));
    const bm = S.bookmarks(u.id);
    setBookmarks(new Set(bm));
  };
  const handleLogin  = (u) => { loadUser(u); setShowAuth(false); };
  const handleLogout = () => { S.clearSession(); setUser(null); setHistory({}); setBookmarks(new Set()); };

  /* ── Bookmarks ── */
  const toggleBookmark = (malId) => {
    setBookmarks(prev => {
      const n = new Set(prev);
      n.has(malId) ? n.delete(malId) : n.add(malId);
      if (user) S.saveBookmarks(user.id, [...n]);
      return n;
    });
  };

  /* ── Watch history ── */
  const saveHistory = (anime, ep) => {
    if (!user) return;
    const h = { anime, ep, updatedAt: Date.now() };
    const next = { ...history, [anime.mal_id]: h };
    setHistory(next);
    S.saveHistory(user.id, next);
  };

  /* ── Data fetching ── */
  const loadHome = useCallback(async () => {
    setLoading(true);
    try {
      const [t, r, o] = await Promise.all([
        fetchRow("/top/anime?type=tv&limit=24&filter=bypopularity"),
        fetchRow("/top/anime?type=tv&limit=24&filter=favorite"),
        fetchRow("/seasons/now?limit=24"),
      ]);
      setTrending(t); setTopRated(r); setOngoing(o);
    } finally { setLoading(false); }
  }, []);

  const loadBrowse = useCallback(async ({ page=1, q="", g="All", append=false }={}) => {
    try {
      const res = await fetchAnime({ page, search:q, genre:g });
      setBrowseList(prev => append ? [...prev, ...res.list] : res.list);
      setHasMore(res.hasMore); setCurPage(res.page);
    } catch(e) { console.error(e); }
  }, []);

  useEffect(() => { loadHome(); }, [loadHome]);

  // Search debounce
  useEffect(() => {
    if (searchQ.trim()) {
      setNav("Browse");
      clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => {
        setLoading(true);
        loadBrowse({ page:1, q:searchQ, g:genre }).finally(()=>setLoading(false));
      }, 500);
    }
    return () => clearTimeout(searchTimer.current);
  }, [searchQ]); // eslint-disable-line

  // Genre or browse nav
  useEffect(() => {
    if (nav !== "Browse") return;
    setLoading(true);
    loadBrowse({ page:1, q:searchQ, g:genre }).finally(()=>setLoading(false));
  }, [genre, nav]); // eslint-disable-line

  const loadMore = async () => {
    setMoreLoading(true);
    await loadBrowse({ page:curPage+1, q:searchQ, g:genre, append:true });
    setMoreLoading(false);
  };

  // Hero rotation
  useEffect(() => {
    if (!trending.length) return;
    const t = setInterval(()=>setHeroIdx(i=>(i+1)%Math.min(6,trending.length)),7500);
    return ()=>clearInterval(t);
  }, [trending.length]);

  const handleWatch = (a, ep=1) => { setWatchAnime(a); setWatchEp(ep); setSelectedAnime(null); window.scrollTo({top:0}); };
  const heroAnime = trending[heroIdx];

  // ── WATCH VIEW ──
  if (watchAnime) return (
    <div style={{background:"#0c0c12",minHeight:"100vh",color:"#e2e8f0"}}>
      <GlobalStyles/>
      <Navbar nav={nav} setNav={n=>{setNav(n);setWatchAnime(null);}} onSearch={setSearchQ} searchQ={searchQ}
        user={user} onAuthOpen={()=>setShowAuth(true)} onLogout={handleLogout}
        mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}/>
      <WatchView anime={watchAnime} startEp={watchEp} onBack={()=>setWatchAnime(null)}
        bookmarked={bookmarks.has(watchAnime.mal_id)} onBookmark={toggleBookmark}
        onSaveHistory={saveHistory}/>
    </div>
  );

  // ── MAIN SITE ──
  return (
    <div style={{minHeight:"100vh",background:"#0c0c12",color:"#e2e8f0",overflowX:"hidden"}}>
      <GlobalStyles/>
      <Navbar nav={nav} setNav={setNav} onSearch={setSearchQ} searchQ={searchQ}
        user={user} onAuthOpen={()=>setShowAuth(true)} onLogout={handleLogout}
        mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}/>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{position:"fixed",top:60,left:0,right:0,zIndex:90,background:"#13131a",borderBottom:"1px solid #1a1a28",padding:"10px 16px",display:"flex",flexDirection:"column",gap:3}}>
          {navLinks.map(n=>(
            <button key={n} onClick={()=>{setNav(n);setMobileOpen(false);}} style={{background:nav===n?"#1a1430":"transparent",border:"none",color:nav===n?"#a78bfa":"#9ca3af",padding:"11px 14px",borderRadius:10,cursor:"pointer",fontSize:15,fontWeight:600,textAlign:"left"}}>
              {n}
            </button>
          ))}
          {!user && <button onClick={()=>{setShowAuth(true);setMobileOpen(false);}} style={{background:"#7c3aed",border:"none",color:"#fff",padding:"12px 14px",borderRadius:10,cursor:"pointer",fontSize:15,fontWeight:700,textAlign:"left",marginTop:4}}>Sign In / Create Account</button>}
        </div>
      )}

      {loading && nav==="Home" && (
        <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14}}>
          <div style={{width:38,height:38,border:"3px solid #252535",borderTop:"3px solid #7c3aed",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
          <div style={{color:"#374151",fontSize:14}}>Loading anime...</div>
        </div>
      )}

      {!loading && (
        <>
          {/* ── HOME ── */}
          {nav==="Home" && (
            <>
              {/* HERO */}
              {heroAnime && !searchQ && (
                <div style={{position:"relative",height:"88vh",minHeight:500,overflow:"hidden"}}>
                  <div key={heroIdx} style={{position:"absolute",inset:0,animation:"heroIn .9s ease"}}>
                    <img src={imgOf(heroAnime)} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    <div style={{position:"absolute",inset:0,background:"linear-gradient(105deg,rgba(12,12,18,.98) 25%,rgba(12,12,18,.6) 60%,rgba(12,12,18,.1) 100%)"}}/>
                    <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,#0c0c12 0%,transparent 45%)"}}/>
                  </div>
                  <div className="hero-content" style={{position:"relative",zIndex:2,height:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:"0 44px 90px",maxWidth:640,animation:"fadeUp .7s ease"}}>
                    <div style={{color:"#a78bfa",fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:12}}>Now Streaming</div>
                    <div style={{color:"#4b5563",fontSize:13,marginBottom:6}}>{heroAnime.title}</div>
                    <h1 className="hero-title" style={{fontSize:44,fontWeight:900,lineHeight:1.06,marginBottom:14,color:"#f8fafc"}}>{titleOf(heroAnime)}</h1>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
                      {genresOf(heroAnime).slice(0,3).map(g=><span key={g} style={{background:"rgba(124,58,237,.15)",border:"1px solid rgba(124,58,237,.3)",color:"#a78bfa",fontSize:11,padding:"3px 10px",borderRadius:20,fontWeight:600}}>{g}</span>)}
                      <span style={{display:"flex",alignItems:"center",gap:3,background:"rgba(251,191,36,.1)",border:"1px solid rgba(251,191,36,.25)",color:"#fbbf24",fontSize:11,padding:"3px 10px",borderRadius:20,fontWeight:600}}><Ic.Star/>{scoreOf(heroAnime)}</span>
                    </div>
                    {heroAnime.synopsis && <p style={{color:"#9ca3af",fontSize:14,lineHeight:1.75,marginBottom:28,maxWidth:430}}>{heroAnime.synopsis.slice(0,190)}…</p>}
                    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                      <button onClick={()=>handleWatch(heroAnime,1)} style={{background:"#7c3aed",color:"#fff",border:"none",borderRadius:11,padding:"13px 28px",fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:8,boxShadow:"0 8px 24px rgba(124,58,237,.45)"}}>
                        <Ic.Play s={16}/> Watch Now
                      </button>
                      <button onClick={()=>setSelectedAnime(heroAnime)} style={{background:"rgba(255,255,255,.07)",color:"#e2e8f0",border:"1px solid rgba(255,255,255,.12)",borderRadius:11,padding:"13px 22px",fontWeight:600,fontSize:14,cursor:"pointer",backdropFilter:"blur(10px)"}}>
                        More Info
                      </button>
                    </div>
                  </div>
                  {/* Dots */}
                  <div style={{position:"absolute",bottom:26,left:44,display:"flex",gap:7,zIndex:2}}>
                    {trending.slice(0,6).map((_,i)=><button key={i} onClick={()=>setHeroIdx(i)} style={{width:i===heroIdx?22:6,height:6,borderRadius:3,background:i===heroIdx?"#7c3aed":"#252535",border:"none",cursor:"pointer",transition:"all .3s",padding:0}}/>)}
                  </div>
                </div>
              )}

              {/* Content rows */}
              <div style={{padding:"24px 20px 60px",maxWidth:1400,margin:"0 auto"}}>
                {/* Continue watching (if logged in + has history) */}
                {user && Object.keys(history).length>0 && (
                  <ContinueRow history={history} bookmarks={bookmarks} onWatch={handleWatch} onSelect={setSelectedAnime} onBookmark={toggleBookmark}/>
                )}
                {!user && (
                  <div style={{marginBottom:32,background:"linear-gradient(135deg,rgba(124,58,237,.12),rgba(124,58,237,.04))",border:"1px solid rgba(124,58,237,.2)",borderRadius:12,padding:"18px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                    <div>
                      <div style={{color:"#f1f5f9",fontWeight:700,fontSize:14,marginBottom:4}}>Track your anime progress</div>
                      <div style={{color:"#6b7280",fontSize:13}}>Sign in to save your watch history and continue where you left off.</div>
                    </div>
                    <button onClick={()=>setShowAuth(true)} style={{background:"#7c3aed",border:"none",borderRadius:10,color:"#fff",padding:"10px 20px",fontWeight:700,fontSize:13,cursor:"pointer",whiteSpace:"nowrap",boxShadow:"0 4px 14px rgba(124,58,237,.35)"}}>
                      Sign In / Sign Up
                    </button>
                  </div>
                )}
                <AnimeRow title="🔥 Trending Now"     list={trending} onSelect={setSelectedAnime} bookmarks={bookmarks} onBookmark={toggleBookmark} historyMap={history}/>
                <AnimeRow title="📺 Currently Airing"  list={ongoing}  onSelect={setSelectedAnime} bookmarks={bookmarks} onBookmark={toggleBookmark} historyMap={history}/>
                <AnimeRow title="⭐ All-Time Favorites" list={topRated} onSelect={setSelectedAnime} bookmarks={bookmarks} onBookmark={toggleBookmark} historyMap={history}/>
              </div>
            </>
          )}

          {/* ── BROWSE ── */}
          {nav==="Browse" && (
            <div style={{padding:"80px 20px 60px",maxWidth:1400,margin:"0 auto"}}>
              <h2 style={{fontSize:22,fontWeight:900,marginBottom:16,color:"#f1f5f9"}}>{searchQ?`Results for "${searchQ}"`:"Browse Anime"}</h2>
              {/* Genre pills */}
              <div className="genre-scroll" style={{marginBottom:22}}>
                {ALL_GENRES.map(g=>(
                  <button key={g} onClick={()=>setGenre(g)} style={{background:genre===g?"#7c3aed":"#141420",color:genre===g?"#fff":"#6b7280",border:genre===g?"1px solid #7c3aed":"1px solid #1a1a28",borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",transition:"all .18s",boxShadow:genre===g?"0 4px 12px rgba(124,58,237,.3)":"none"}}>
                    {g}
                  </button>
                ))}
              </div>
              {loading ? (
                <div style={{textAlign:"center",padding:"60px 0"}}><div style={{width:34,height:34,border:"3px solid #252535",borderTop:"3px solid #7c3aed",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto"}}/></div>
              ) : (
                <>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:14,alignItems:"center"}}>
                    <span style={{color:"#4b5563",fontSize:13}}>{browseList.length} titles</span>
                  </div>
                  <div className="anime-grid">
                    {browseList.map((a,i)=>(
                      <div key={a.mal_id} style={{animation:`fadeUp .3s ease ${Math.min(i*.04,.5)}s both`}}>
                        <AnimeCard a={a} onClick={setSelectedAnime} bookmarked={bookmarks.has(a.mal_id)} onBookmark={toggleBookmark} progress={history[a.mal_id]&&a.episodes?(history[a.mal_id].ep/a.episodes)*100:0}/>
                      </div>
                    ))}
                  </div>
                  {browseList.length===0&&!loading&&(
                    <div style={{textAlign:"center",padding:"60px 0",color:"#374151"}}>
                      <div style={{fontSize:36,marginBottom:10}}>🔍</div>
                      <div style={{fontSize:15,fontWeight:600,color:"#6b7280"}}>No results for "{searchQ}"</div>
                    </div>
                  )}
                  {hasMore&&browseList.length>0&&(
                    <div style={{textAlign:"center",marginTop:30}}>
                      <button onClick={loadMore} disabled={moreLoading} style={{background:moreLoading?"#141420":"#7c3aed",color:"#fff",border:moreLoading?"1px solid #252535":"none",borderRadius:11,padding:"12px 36px",fontSize:14,fontWeight:700,cursor:moreLoading?"default":"pointer",opacity:moreLoading?.7:1,boxShadow:moreLoading?"none":"0 6px 18px rgba(124,58,237,.35)"}}>
                        {moreLoading?"Loading...":"Load More"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── SCHEDULE ── */}
          {nav==="Schedule" && (
            <div style={{padding:"80px 20px 60px",maxWidth:1400,margin:"0 auto",animation:"fadeUp .4s ease"}}>
              <h2 style={{fontSize:22,fontWeight:900,marginBottom:6,color:"#f1f5f9"}}>📅 Airing Schedule</h2>
              <p style={{color:"#6b7280",marginBottom:24,fontSize:13}}>Weekly release calendar</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))",gap:12}}>
                {SCHEDULE.map(({day,shows})=>(
                  <div key={day} style={{background:"#141420",borderRadius:12,padding:16,border:"1px solid #1a1a28"}}>
                    <div style={{color:"#a78bfa",fontWeight:800,fontSize:15,marginBottom:12}}>{day}</div>
                    {shows.map(s=><div key={s} style={{display:"flex",alignItems:"center",gap:7,padding:"6px 0",borderBottom:"1px solid #0c0c14",color:"#9ca3af",fontSize:13}}><div style={{width:5,height:5,borderRadius:"50%",background:"#7c3aed",flexShrink:0}}/>{s}</div>)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── BOOKMARKS ── */}
          {nav==="Bookmarks" && (
            <div style={{padding:"80px 20px 60px",maxWidth:1400,margin:"0 auto",animation:"fadeUp .4s ease"}}>
              <h2 style={{fontSize:22,fontWeight:900,marginBottom:6,color:"#f1f5f9"}}>🔖 My List</h2>
              <p style={{color:"#6b7280",marginBottom:22,fontSize:13}}>{bookmarks.size} saved anime</p>
              {!user && <div style={{textAlign:"center",padding:"60px 0",color:"#374151"}}><div style={{fontSize:44,marginBottom:12}}>🔒</div><div style={{fontSize:15,fontWeight:700,color:"#6b7280",marginBottom:10}}>Sign in to see your bookmarks</div><button onClick={()=>setShowAuth(true)} style={{background:"#7c3aed",border:"none",borderRadius:10,color:"#fff",padding:"11px 22px",fontWeight:700,fontSize:14,cursor:"pointer"}}>Sign In</button></div>}
              {user && bookmarks.size===0 && <div style={{textAlign:"center",padding:"60px 0",color:"#374151"}}><div style={{fontSize:44,marginBottom:12}}>🔖</div><div style={{fontSize:15,fontWeight:700,color:"#6b7280"}}>Nothing saved yet</div><div style={{fontSize:13,marginTop:6}}>Tap the bookmark icon on any anime</div></div>}
              {user && bookmarks.size>0 && (
                <div className="anime-grid">
                  {[...trending,...topRated,...ongoing].filter((a,i,arr)=>arr.findIndex(x=>x.mal_id===a.mal_id)===i&&bookmarks.has(a.mal_id)).map((a,i)=>(
                    <div key={a.mal_id} style={{animation:`fadeUp .3s ease ${i*.07}s both`}}>
                      <AnimeCard a={a} onClick={setSelectedAnime} bookmarked={true} onBookmark={toggleBookmark}/>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <footer style={{borderTop:"1px solid #1a1a28",padding:"26px 20px",textAlign:"center"}}>
            <div style={{fontSize:17,fontWeight:900,color:"#f1f5f9",marginBottom:6,letterSpacing:-.3}}>⚡ AniStream</div>
            <div style={{fontSize:11,color:"#252535"}}>© 2026 AniStream · Data via Jikan/MyAnimeList · Entertainment only · Not affiliated with any studio</div>
          </footer>
        </>
      )}

      {selectedAnime && <AnimeModal anime={selectedAnime} onClose={()=>setSelectedAnime(null)} bookmarked={bookmarks.has(selectedAnime.mal_id)} onBookmark={toggleBookmark} onWatch={handleWatch}/>}
      {showAuth      && <AuthModal onClose={()=>setShowAuth(false)} onLogin={handleLogin}/>}
    </div>
  );
}

/* ══════════════════════════════════════════════
   GLOBAL STYLES
══════════════════════════════════════════════ */
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
      html,body{overflow-x:hidden;max-width:100%;background:#0c0c12;}
      body{font-family:'Inter','Segoe UI',sans-serif;}
      ::-webkit-scrollbar{width:4px;height:4px;}
      ::-webkit-scrollbar-track{background:#0c0c12;}
      ::-webkit-scrollbar-thumb{background:#1a1a28;border-radius:2px;}
      ::-webkit-scrollbar-thumb:hover{background:#7c3aed;}
      .hide-scroll{scrollbar-width:none;-ms-overflow-style:none;}
      .hide-scroll::-webkit-scrollbar{display:none;}
      @keyframes fadeUp{from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);}}
      @keyframes heroIn{from{opacity:0;transform:scale(1.02);}to{opacity:1;transform:scale(1);}}
      @keyframes modalIn{from{opacity:0;transform:translateY(12px) scale(.97);}to{opacity:1;transform:translateY(0) scale(1);}}
      @keyframes spin{to{transform:rotate(360deg);}}
      .anime-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:14px;}
      .genre-scroll{display:flex;gap:7px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none;-ms-overflow-style:none;}
      .genre-scroll::-webkit-scrollbar{display:none;}
      .watch-layout{display:flex;gap:18px;padding:14px 20px 60px;max-width:1400px;margin:0 auto;}
      .watch-main{flex:1;min-width:0;}
      .watch-sidebar{width:290px;flex-shrink:0;position:sticky;top:72px;max-height:calc(100vh - 80px);overflow:hidden;}
      .desk-nav{display:flex;gap:2px;align-items:center;}
      .hamburger{display:none !important;}
      @media(max-width:860px){
        .anime-grid{grid-template-columns:repeat(auto-fill,minmax(110px,1fr)) !important;gap:10px !important;}
        .hero-content{padding:0 16px 36px !important;max-width:100% !important;}
        .hero-title{font-size:22px !important;}
        .watch-layout{flex-direction:column !important;padding:10px 12px 40px !important;}
        .watch-sidebar{width:100% !important;position:static !important;max-height:none !important;}
        .desk-nav{display:none !important;}
        .hamburger{display:flex !important;}
        .search-label{display:none;}
      }
    `}</style>
  );
}
