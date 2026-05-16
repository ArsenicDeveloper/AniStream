import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────── */
const ANIME_DATA = [
  {
    id: "demon-slayer",
    title: "Demon Slayer",
    titleJp: "鬼滅の刃",
    episode: "Ep 12", season: "Season 4",
    genre: ["Action", "Fantasy", "Drama"],
    rating: 9.0, year: 2024, status: "Ongoing", dub: true, totalEps: 12,
    description: "Tanjiro and his allies face their most fearsome enemy yet — the demon lord Muzan — in a battle that will decide the fate of all humanity.",
    img: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80",
    banner: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1400&q=80",
    color: "#e040fb",
  },
  {
    id: "jujutsu-kaisen",
    title: "Jujutsu Kaisen",
    titleJp: "呪術廻戦",
    episode: "Ep 23", season: "Season 2",
    genre: ["Action", "Supernatural"],
    rating: 8.8, year: 2024, status: "Ongoing", dub: true, totalEps: 23,
    description: "Yuji Itadori joins a secret organization of Jujutsu Sorcerers to eliminate a powerful curse named Ryomen Sukuna.",
    img: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
    banner: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1400&q=80",
    color: "#00e5ff",
  },
  {
    id: "attack-on-titan",
    title: "Attack on Titan",
    titleJp: "進撃の巨人",
    episode: "Complete", season: "Final Arc",
    genre: ["Action", "Dark Fantasy"],
    rating: 9.9, year: 2023, status: "Completed", dub: true, totalEps: 87,
    description: "Eren Yeager wages a final war against the world to protect his homeland — but at what cost?",
    img: "https://images.unsplash.com/photo-1514477917009-389c76a86b68?w=800&q=80",
    banner: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=1400&q=80",
    color: "#2ecc71",
  },
  {
    id: "one-piece",
    title: "One Piece",
    titleJp: "ワンピース",
    episode: "Ep 1110", season: "Egghead Arc",
    genre: ["Adventure", "Fantasy"],
    rating: 9.1, year: 2024, status: "Ongoing", dub: true, totalEps: 1110,
    description: "Monkey D. Luffy sails the seas in search of the legendary One Piece to become King of the Pirates.",
    img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
    banner: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1400&q=80",
    color: "#f39c12",
  },
  {
    id: "frieren",
    title: "Frieren: Beyond Journey's End",
    titleJp: "葬送のフリーレン",
    episode: "Ep 28", season: "Season 1",
    genre: ["Fantasy", "Adventure", "Slice of Life"],
    rating: 9.3, year: 2024, status: "Completed", dub: false, totalEps: 28,
    description: "An elven mage reflects on the meaning of life and companionship as centuries pass around her.",
    img: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=800&q=80",
    banner: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1400&q=80",
    color: "#1abc9c",
  },
  {
    id: "chainsaw-man",
    title: "Chainsaw Man",
    titleJp: "チェンソーマン",
    episode: "Ep 12", season: "Season 1",
    genre: ["Action", "Dark Fantasy", "Horror"],
    rating: 8.7, year: 2023, status: "Completed", dub: true, totalEps: 12,
    description: "Denji becomes a hybrid human-devil, serving as a devil hunter for a mysterious government agency.",
    img: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80",
    banner: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=1400&q=80",
    color: "#e74c3c",
  },
  {
    id: "vinland-saga",
    title: "Vinland Saga",
    titleJp: "ヴィンランド・サガ",
    episode: "Ep 24", season: "Season 2",
    genre: ["Historical", "Action", "Drama"],
    rating: 9.0, year: 2023, status: "Completed", dub: false, totalEps: 48,
    description: "A former warrior seeks redemption through a life of non-violence in a brutal Viking world.",
    img: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
    banner: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1400&q=80",
    color: "#3498db",
  },
  {
    id: "solo-leveling",
    title: "Solo Leveling",
    titleJp: "俺だけレベルアップな件",
    episode: "Ep 13", season: "Season 1",
    genre: ["Action", "Fantasy", "Adventure"],
    rating: 8.5, year: 2024, status: "Completed", dub: true, totalEps: 13,
    description: "The weakest hunter in a world of monsters awakens a mysterious power that lets him grow without limit.",
    img: "https://images.unsplash.com/photo-1514477917009-389c76a86b68?w=800&q=80",
    banner: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1400&q=80",
    color: "#9b59b6",
  },
];

// Generate episode list for an anime
const getEpisodes = (anime) =>
  Array.from({ length: Math.min(anime.totalEps, 50) }, (_, i) => ({
    num: i + 1,
    title: `Episode ${i + 1}`,
    duration: "24m",
  }));

const RECENT_EPISODES = [
  { id: 1, animeId: "demon-slayer", ep: 12, title: "The Final Battle Begins", time: "1 hour ago", img: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80" },
  { id: 2, animeId: "jujutsu-kaisen", ep: 23, title: "Shibuya Incident: Part 3", time: "3 hours ago", img: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80" },
  { id: 3, animeId: "one-piece", ep: 1110, title: "The Iron Giant Awakens", time: "5 hours ago", img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80" },
  { id: 4, animeId: "solo-leveling", ep: 13, title: "Arise: True Monarch", time: "8 hours ago", img: "https://images.unsplash.com/photo-1514477917009-389c76a86b68?w=400&q=80" },
  { id: 5, animeId: "frieren", ep: 28, title: "A Nameless Journey", time: "12 hours ago", img: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=400&q=80" },
  { id: 6, animeId: "chainsaw-man", ep: 12, title: "Makima's Revelation", time: "1 day ago", img: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80" },
];

const GENRES = ["All","Action","Adventure","Fantasy","Drama","Horror","Sci-Fi","Slice of Life","Supernatural","Historical","Dark Fantasy"];

const SCHEDULE = [
  { day: "Mon", shows: ["Demon Slayer", "One Piece"] },
  { day: "Tue", shows: ["Jujutsu Kaisen"] },
  { day: "Wed", shows: ["Solo Leveling", "Chainsaw Man"] },
  { day: "Thu", shows: ["Vinland Saga"] },
  { day: "Fri", shows: ["Frieren"] },
  { day: "Sat", shows: ["Attack on Titan"] },
  { day: "Sun", shows: ["One Piece", "Demon Slayer"] },
];

/* ─────────────────────────────────────────────────────────────
   EMBED URL — Update this with the correct flixcloud.cc format
   Example: https://flixcloud.cc/embed/[video-id]
   You need to map each anime's real video ID from flixcloud.cc
───────────────────────────────────────────────────────────── */
const getEmbedUrl = (animeId, episode) => {
  // Replace with your real flixcloud.cc embed URLs
  // Format: https://flixcloud.cc/embed/[video-id]?ep=[episode]
  return `https://flixcloud.cc/embed/${animeId}?ep=${episode}`;
};

/* ─────────────────────────────────────────────────────────────
   ICONS
───────────────────────────────────────────────────────────── */
const StarIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#fbbf24" stroke="none">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
  </svg>
);
const PlayIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5,3 19,12 5,21" />
  </svg>
);
const SearchIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const CloseIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const BookmarkIcon = ({ filled }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);
const ChevronLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);
const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   ANIME CARD
───────────────────────────────────────────────────────────── */
function AnimeCard({ anime, onClick, bookmarked, onBookmark }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="anime-card"
      onClick={() => onClick(anime)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative", cursor: "pointer", borderRadius: 12, overflow: "hidden",
        background: "#0d1421",
        transform: hovered ? "translateY(-5px) scale(1.02)" : "none",
        boxShadow: hovered ? `0 20px 50px rgba(0,0,0,0.7), 0 0 24px ${anime.color}28` : "0 4px 20px rgba(0,0,0,0.35)",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
        flexShrink: 0,
      }}>
      <div style={{ position: "relative", paddingBottom: "145%", overflow: "hidden" }}>
        <img src={anime.img} alt={anime.title} style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover",
          transform: hovered ? "scale(1.07)" : "scale(1)",
          transition: "transform 0.4s ease",
        }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(7,11,18,1) 0%, rgba(7,11,18,0.45) 55%, transparent 100%)" }} />

        {/* Status badge */}
        <div style={{
          position: "absolute", top: 9, left: 9,
          background: anime.status === "Ongoing" ? "#059669" : "#374151",
          color: "#fff", fontSize: 9, fontWeight: 700, padding: "3px 7px",
          borderRadius: 20, textTransform: "uppercase", letterSpacing: 0.8,
        }}>{anime.status}</div>

        {/* DUB badge */}
        {anime.dub && (
          <div style={{
            position: "absolute", top: 9, right: 36,
            background: "rgba(224,64,251,0.12)", border: "1px solid rgba(224,64,251,0.5)",
            color: "#e040fb", fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 20,
          }}>DUB</div>
        )}

        {/* Bookmark */}
        <button onClick={e => { e.stopPropagation(); onBookmark(anime.id); }} style={{
          position: "absolute", top: 7, right: 7, background: "rgba(0,0,0,0.55)",
          border: "none", color: bookmarked ? "#e040fb" : "#9ca3af", cursor: "pointer",
          borderRadius: 7, padding: "5px 6px", display: "flex",
          transition: "color 0.2s, background 0.2s",
        }}><BookmarkIcon filled={bookmarked} /></button>

        {/* Play overlay */}
        {hovered && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.2)",
          }}>
            <div style={{
              width: 50, height: 50, borderRadius: "50%",
              background: "#e040fb", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 30px #e040fb99",
            }}><PlayIcon size={20} /></div>
          </div>
        )}

        {/* Info */}
        <div style={{ position: "absolute", bottom: 8, left: 8, right: 8 }}>
          <div style={{ color: "#e040fb", fontSize: 10, fontWeight: 600, marginBottom: 3 }}>{anime.episode}</div>
          <div style={{ color: "#fff", fontSize: 12, fontWeight: 700, lineHeight: 1.3, textShadow: "0 2px 8px rgba(0,0,0,0.9)" }}>{anime.title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
            <StarIcon /><span style={{ color: "#fbbf24", fontSize: 11, fontWeight: 600 }}>{anime.rating}</span>
            <span style={{ color: "#4b5563", fontSize: 11 }}>·</span>
            <span style={{ color: "#6b7280", fontSize: 11 }}>{anime.year}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   EPISODE CARD (sidebar)
───────────────────────────────────────────────────────────── */
function EpisodeCard({ ep, anime, onWatch }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={() => onWatch(anime, ep.ep)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", gap: 10, cursor: "pointer", padding: "9px 12px",
        borderRadius: 10, background: hovered ? "#131d2e" : "transparent",
        transition: "background 0.2s", alignItems: "center",
      }}>
      <div style={{ position: "relative", width: 84, height: 52, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
        <img src={ep.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: hovered ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.15)",
          transition: "background 0.2s",
        }}>
          {hovered && <PlayIcon size={16} />}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "#e040fb", fontSize: 10, fontWeight: 600, marginBottom: 2 }}>Ep {ep.ep}</div>
        <div style={{ color: "#d1d5db", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ep.title}</div>
        <div style={{ color: "#4b5563", fontSize: 11, marginTop: 3 }}>{ep.time}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   WATCH VIEW (full video player page)
───────────────────────────────────────────────────────────── */
function WatchView({ anime, startEp = 1, onBack, bookmarked, onBookmark }) {
  const [currentEp, setCurrentEp] = useState(startEp);
  const [epView, setEpView] = useState("grid"); // "grid" | "list"
  const episodes = getEpisodes(anime);
  const epListRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [anime]);

  // Scroll active episode into view
  useEffect(() => {
    const active = epListRef.current?.querySelector(".ep-active");
    if (active) active.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentEp]);

  return (
    <div style={{ minHeight: "100vh", background: "#070b12", paddingTop: 60 }}>
      {/* Back bar */}
      <div style={{
        padding: "12px 24px", borderBottom: "1px solid #161f30",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <button onClick={onBack} style={{
          background: "#111927", border: "1px solid #1e2d42", borderRadius: 8,
          color: "#9ca3af", cursor: "pointer", padding: "6px 12px",
          display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600,
          transition: "color 0.2s, border-color 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#e040fb"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.borderColor = "#1e2d42"; }}
        >
          <ChevronLeft /> Back
        </button>
        <span style={{ color: "#6b7280", fontSize: 13 }}>
          {anime.title} <span style={{ color: "#374151" }}>·</span> Episode {currentEp}
        </span>
      </div>

      {/* Main layout */}
      <div className="watch-layout">
        {/* Left: Player + Info */}
        <div className="watch-main">
          {/* VIDEO PLAYER */}
          <div style={{
            width: "100%", aspectRatio: "16 / 9", background: "#000",
            borderRadius: 12, overflow: "hidden", position: "relative",
            boxShadow: "0 8px 40px rgba(0,0,0,0.7)",
          }}>
            <iframe
              key={`${anime.id}-${currentEp}`}
              src={getEmbedUrl(anime.id, currentEp)}
              title={`${anime.title} Episode ${currentEp}`}
              allowFullScreen
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          </div>

          {/* Episode nav buttons */}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button
              onClick={() => setCurrentEp(e => Math.max(1, e - 1))}
              disabled={currentEp <= 1}
              style={{
                flex: 1, background: currentEp <= 1 ? "#111927" : "#161f30",
                border: "1px solid #1e2d42", borderRadius: 8, color: currentEp <= 1 ? "#374151" : "#9ca3af",
                padding: "9px 0", cursor: currentEp <= 1 ? "default" : "pointer",
                fontSize: 13, fontWeight: 600, transition: "all 0.2s",
              }}>← Prev Episode</button>
            <button
              onClick={() => setCurrentEp(e => Math.min(anime.totalEps, e + 1))}
              disabled={currentEp >= anime.totalEps}
              style={{
                flex: 1, background: currentEp >= anime.totalEps ? "#111927" : "#161f30",
                border: "1px solid #1e2d42", borderRadius: 8,
                color: currentEp >= anime.totalEps ? "#374151" : "#9ca3af",
                padding: "9px 0", cursor: currentEp >= anime.totalEps ? "default" : "pointer",
                fontSize: 13, fontWeight: 600, transition: "all 0.2s",
              }}>Next Episode →</button>
          </div>

          {/* Anime Info */}
          <div style={{ marginTop: 20, padding: "20px", background: "#0d1421", borderRadius: 12, border: "1px solid #161f30" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <img src={anime.img} alt={anime.title} style={{
                width: 80, height: 110, objectFit: "cover", borderRadius: 8, flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#e040fb", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{anime.titleJp}</div>
                <div style={{ color: "#f1f5f9", fontSize: 19, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>{anime.title}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#fbbf24", fontSize: 12, fontWeight: 600 }}>
                    <StarIcon size={11} /> {anime.rating}
                  </span>
                  <span style={{ color: "#374151", fontSize: 12 }}>·</span>
                  <span style={{ color: "#6b7280", fontSize: 12 }}>{anime.year}</span>
                  <span style={{ color: "#374151", fontSize: 12 }}>·</span>
                  <span style={{ color: anime.status === "Ongoing" ? "#10b981" : "#6b7280", fontSize: 12, fontWeight: 600 }}>{anime.status}</span>
                  {anime.dub && (
                    <span style={{
                      background: "rgba(224,64,251,0.1)", border: "1px solid rgba(224,64,251,0.35)",
                      color: "#e040fb", fontSize: 10, padding: "2px 7px", borderRadius: 20, fontWeight: 700,
                    }}>DUB</span>
                  )}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                  {anime.genre.map(g => (
                    <span key={g} style={{ background: "#161f30", color: "#6b7280", fontSize: 11, padding: "3px 9px", borderRadius: 20 }}>{g}</span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => onBookmark(anime.id)} style={{
                    background: bookmarked ? "rgba(224,64,251,0.12)" : "#161f30",
                    border: `1px solid ${bookmarked ? "rgba(224,64,251,0.4)" : "#1e2d42"}`,
                    color: bookmarked ? "#e040fb" : "#9ca3af", borderRadius: 8,
                    padding: "7px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <BookmarkIcon filled={bookmarked} />
                    {bookmarked ? "Saved" : "Save"}
                  </button>
                </div>
              </div>
            </div>
            <p style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.75, marginTop: 16 }}>{anime.description}</p>
          </div>
        </div>

        {/* Right: Episode List */}
        <div className="watch-sidebar" ref={epListRef}>
          <div style={{ background: "#0d1421", borderRadius: 12, border: "1px solid #161f30", overflow: "hidden" }}>
            <div style={{
              padding: "14px 16px", borderBottom: "1px solid #161f30",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>
                Episodes <span style={{ color: "#374151", fontWeight: 400, fontSize: 13 }}>({anime.totalEps})</span>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {[["grid", <GridIcon />], ["list", <ListIcon />]].map(([v, icon]) => (
                  <button key={v} onClick={() => setEpView(v)} style={{
                    background: epView === v ? "#1e2d42" : "transparent",
                    border: "1px solid " + (epView === v ? "#2d3f58" : "transparent"),
                    color: epView === v ? "#e040fb" : "#4b5563",
                    borderRadius: 6, padding: "4px 7px", cursor: "pointer", display: "flex",
                  }}>{icon}</button>
                ))}
              </div>
            </div>
            <div style={{ maxHeight: 480, overflowY: "auto", padding: "8px" }} className="ep-scroll-y">
              {epView === "grid" ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                  {episodes.map(ep => (
                    <button key={ep.num}
                      className={currentEp === ep.num ? "ep-active" : ""}
                      onClick={() => setCurrentEp(ep.num)}
                      style={{
                        background: currentEp === ep.num ? "#e040fb" : "#111927",
                        border: `1px solid ${currentEp === ep.num ? "#e040fb" : "#1e2d42"}`,
                        color: currentEp === ep.num ? "#fff" : "#9ca3af",
                        borderRadius: 7, padding: "8px 4px", cursor: "pointer",
                        fontSize: 12, fontWeight: 600, transition: "all 0.15s",
                      }}>{ep.num}</button>
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {episodes.map(ep => (
                    <button key={ep.num}
                      className={currentEp === ep.num ? "ep-active" : ""}
                      onClick={() => setCurrentEp(ep.num)}
                      style={{
                        background: currentEp === ep.num ? "#1a1f35" : "transparent",
                        border: `1px solid ${currentEp === ep.num ? "#e040fb44" : "transparent"}`,
                        color: currentEp === ep.num ? "#e040fb" : "#9ca3af",
                        borderRadius: 8, padding: "8px 12px", cursor: "pointer",
                        fontSize: 13, fontWeight: currentEp === ep.num ? 700 : 400,
                        textAlign: "left", width: "100%", transition: "all 0.15s",
                        display: "flex", alignItems: "center", gap: 10,
                      }}>
                      <span style={{
                        width: 28, height: 28, borderRadius: 6,
                        background: currentEp === ep.num ? "#e040fb" : "#1e2d42",
                        color: currentEp === ep.num ? "#fff" : "#6b7280",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 700, flexShrink: 0,
                      }}>{ep.num}</span>
                      Episode {ep.num}
                      <span style={{ marginLeft: "auto", color: "#374151", fontSize: 11 }}>{ep.duration}</span>
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

/* ─────────────────────────────────────────────────────────────
   ANIME DETAIL MODAL
───────────────────────────────────────────────────────────── */
function AnimeModal({ anime, onClose, bookmarked, onBookmark, onWatch }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
      backdropFilter: "blur(10px)",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#0a1020", borderRadius: 20, width: "100%", maxWidth: 820,
        maxHeight: "90vh", overflowY: "auto", border: "1px solid #1a2840",
        boxShadow: `0 30px 80px rgba(0,0,0,0.85), 0 0 60px ${anime.color}18`,
        animation: "modalIn 0.25s ease",
      }}>
        {/* Banner */}
        <div style={{ position: "relative", height: 240, overflow: "hidden", borderRadius: "20px 20px 0 0" }}>
          <img src={anime.banner} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0a1020 0%, transparent 55%)" }} />
          <button onClick={onClose} style={{
            position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.6)",
            border: "1px solid rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer",
            borderRadius: 10, padding: 8, display: "flex",
          }}><CloseIcon size={18} /></button>
        </div>
        {/* Content */}
        <div style={{ padding: "20px 28px 28px" }}>
          <div style={{ color: "#e040fb", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>{anime.titleJp}</div>
          <div style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 800, marginBottom: 10, lineHeight: 1.2 }}>{anime.title}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 14 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#fbbf24", fontWeight: 700, fontSize: 13 }}>
              <StarIcon /> {anime.rating}
            </span>
            <span style={{ color: "#374151" }}>·</span>
            <span style={{ color: "#6b7280", fontSize: 13 }}>{anime.year}</span>
            <span style={{ color: "#374151" }}>·</span>
            <span style={{ color: anime.status === "Ongoing" ? "#10b981" : "#6b7280", fontSize: 13, fontWeight: 600 }}>{anime.status}</span>
            <span style={{ color: "#374151" }}>·</span>
            <span style={{ color: "#6b7280", fontSize: 13 }}>{anime.episode}</span>
            {anime.dub && (
              <span style={{
                background: "rgba(224,64,251,0.1)", border: "1px solid rgba(224,64,251,0.4)",
                color: "#e040fb", fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700,
              }}>DUB</span>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {anime.genre.map(g => (
              <span key={g} style={{ background: "#161f30", color: "#6b7280", fontSize: 12, padding: "4px 10px", borderRadius: 20 }}>{g}</span>
            ))}
          </div>
          <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.75, marginBottom: 22 }}>{anime.description}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => { onClose(); onWatch(anime, 1); }} style={{
              background: "linear-gradient(135deg, #e040fb, #7c4dff)", color: "#fff",
              border: "none", borderRadius: 12, padding: "12px 28px", fontWeight: 700,
              fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              boxShadow: "0 6px 24px rgba(224,64,251,0.35)",
            }}>
              <PlayIcon size={16} /> Watch Now
            </button>
            <button onClick={() => onBookmark(anime.id)} style={{
              background: bookmarked ? "rgba(224,64,251,0.1)" : "#161f30",
              border: `1px solid ${bookmarked ? "rgba(224,64,251,0.4)" : "#1e2d42"}`,
              color: bookmarked ? "#e040fb" : "#9ca3af", borderRadius: 12,
              padding: "12px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <BookmarkIcon filled={bookmarked} /> {bookmarked ? "Saved" : "Add to List"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────────────────────── */
export default function App() {
  const [activeNav, setActiveNav] = useState("Home");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState(null); // for modal
  const [watchingAnime, setWatchingAnime] = useState(null); // for watch view
  const [watchEp, setWatchEp] = useState(1);
  const [bookmarks, setBookmarks] = useState(new Set());
  const [heroIndex, setHeroIndex] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const heroAnime = ANIME_DATA[heroIndex];
  const navLinks = ["Home", "Trending", "Schedule", "Bookmarks"];

  useEffect(() => {
    setTimeout(() => setLoaded(true), 80);
    const t = setInterval(() => setHeroIndex(i => (i + 1) % 3), 7000);
    return () => clearInterval(t);
  }, []);

  const toggleBookmark = (id) => {
    setBookmarks(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleWatch = (anime, ep = 1) => {
    setWatchingAnime(anime);
    setWatchEp(ep);
    setSelectedAnime(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredAnime = ANIME_DATA.filter(a => {
    const matchGenre = selectedGenre === "All" || a.genre.includes(selectedGenre);
    const matchSearch = !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchGenre && matchSearch;
  });

  // ── WATCH VIEW ──
  if (watchingAnime) {
    return (
      <div style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.5s" }}>
        <GlobalStyles />
        <Navbar
          navLinks={navLinks} activeNav={activeNav} setActiveNav={(n) => { setActiveNav(n); setWatchingAnime(null); }}
          searchActive={searchActive} setSearchActive={setSearchActive}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          mobileMenu={mobileMenu} setMobileMenu={setMobileMenu}
        />
        <WatchView
          anime={watchingAnime} startEp={watchEp}
          onBack={() => setWatchingAnime(null)}
          bookmarked={bookmarks.has(watchingAnime.id)}
          onBookmark={toggleBookmark}
        />
      </div>
    );
  }

  // ── MAIN SITE ──
  return (
    <div style={{ minHeight: "100vh", background: "#070b12", color: "#e2e8f0", opacity: loaded ? 1 : 0, transition: "opacity 0.6s" }}>
      <GlobalStyles />
      <Navbar
        navLinks={navLinks} activeNav={activeNav} setActiveNav={setActiveNav}
        searchActive={searchActive} setSearchActive={setSearchActive}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        mobileMenu={mobileMenu} setMobileMenu={setMobileMenu}
      />

      {/* MOBILE MENU */}
      {mobileMenu && (
        <div style={{
          position: "fixed", top: 60, left: 0, right: 0, zIndex: 90,
          background: "#0a1020", borderBottom: "1px solid #161f30",
          padding: "12px 20px", display: "flex", flexDirection: "column", gap: 4,
        }}>
          {navLinks.map(n => (
            <button key={n} onClick={() => { setActiveNav(n); setMobileMenu(false); }} style={{
              background: activeNav === n ? "#1a2840" : "transparent",
              border: "none", color: activeNav === n ? "#e040fb" : "#9ca3af",
              padding: "11px 14px", borderRadius: 10, cursor: "pointer",
              fontSize: 15, fontWeight: 600, textAlign: "left",
            }}>{n}</button>
          ))}
        </div>
      )}

      {/* HERO */}
      {activeNav === "Home" && !searchQuery && (
        <div style={{ position: "relative", height: "90vh", minHeight: 500, overflow: "hidden" }}>
          <div key={heroIndex} style={{ position: "absolute", inset: 0, animation: "heroIn 0.9s ease" }}>
            <img src={heroAnime.banner} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(7,11,18,0.97) 30%, rgba(7,11,18,0.55) 65%, rgba(7,11,18,0.15) 100%)" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #070b12 0%, transparent 45%)" }} />
          </div>
          <div className="hero-content" style={{
            position: "relative", zIndex: 2, height: "100%",
            display: "flex", flexDirection: "column", justifyContent: "flex-end",
            padding: "0 48px 80px", maxWidth: 680, animation: "fadeUp 0.8s ease",
          }}>
            <div style={{ color: "#e040fb", fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>
              ⚡ NOW STREAMING · {heroAnime.season}
            </div>
            <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 6 }}>{heroAnime.titleJp}</div>
            <h1 className="hero-title" style={{ fontSize: 50, fontWeight: 900, lineHeight: 1.08, marginBottom: 14, textShadow: "0 4px 30px rgba(0,0,0,0.6)" }}>
              {heroAnime.title}
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
              {heroAnime.genre.map(g => (
                <span key={g} style={{ background: "rgba(224,64,251,0.12)", border: "1px solid rgba(224,64,251,0.28)", color: "#e040fb", fontSize: 11, padding: "4px 11px", borderRadius: 20, fontWeight: 600 }}>{g}</span>
              ))}
              <span style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24", fontSize: 11, padding: "4px 11px", borderRadius: 20, fontWeight: 600 }}>
                <StarIcon size={10} /> {heroAnime.rating}
              </span>
            </div>
            <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.75, marginBottom: 28, maxWidth: 460 }}>{heroAnime.description}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => handleWatch(heroAnime, 1)} style={{
                background: "linear-gradient(135deg, #e040fb, #7c4dff)", color: "#fff",
                border: "none", borderRadius: 12, padding: "13px 28px", fontWeight: 700,
                fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                boxShadow: "0 8px 28px rgba(224,64,251,0.4)",
              }}><PlayIcon size={18} /> Watch Now</button>
              <button onClick={() => setSelectedAnime(heroAnime)} style={{
                background: "rgba(255,255,255,0.06)", color: "#e2e8f0",
                border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "13px 22px",
                fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                backdropFilter: "blur(10px)",
              }}>More Info</button>
            </div>
          </div>
          {/* Hero dots */}
          <div style={{ position: "absolute", bottom: 26, left: 48, display: "flex", gap: 8, zIndex: 2 }}>
            {[0, 1, 2].map(i => (
              <button key={i} onClick={() => setHeroIndex(i)} style={{
                width: i === heroIndex ? 26 : 7, height: 7, borderRadius: 4,
                background: i === heroIndex ? "#e040fb" : "#1e2d42",
                border: "none", cursor: "pointer", transition: "all 0.3s", padding: 0,
              }} />
            ))}
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div style={{ padding: activeNav === "Home" ? "0 24px 60px" : "80px 24px 60px", maxWidth: 1400, margin: "0 auto" }}>

        {/* ── HOME ── */}
        {activeNav === "Home" && (
          <>
            {searchQuery && (
              <div style={{ marginBottom: 18, color: "#6b7280", fontSize: 13 }}>
                Results for <strong style={{ color: "#e040fb" }}>"{searchQuery}"</strong> — {filteredAnime.length} found
              </div>
            )}
            <div className="main-layout">
              {/* Left content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Genre filter */}
                <div className="genre-scroll" style={{ marginBottom: 24 }}>
                  {GENRES.map(g => (
                    <button key={g} onClick={() => setSelectedGenre(g)} style={{
                      background: selectedGenre === g ? "#e040fb" : "#0d1421",
                      color: selectedGenre === g ? "#fff" : "#6b7280",
                      border: selectedGenre === g ? "1px solid #e040fb" : "1px solid #1e2d42",
                      borderRadius: 20, padding: "7px 15px", fontSize: 12, fontWeight: 600,
                      cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s",
                      boxShadow: selectedGenre === g ? "0 4px 14px rgba(224,64,251,0.3)" : "none",
                    }}>{g}</button>
                  ))}
                </div>
                {/* Grid */}
                <div style={{ marginBottom: 32 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 800, display: "flex", alignItems: "center", gap: 7 }}>
                      <span>🔥</span>
                      {searchQuery ? "Search Results" : selectedGenre !== "All" ? selectedGenre : "Trending This Season"}
                    </h2>
                  </div>
                  <div className="anime-grid">
                    {filteredAnime.map((a, i) => (
                      <div key={a.id} style={{ animation: `fadeUp 0.4s ease ${i * 0.05}s both` }}>
                        <AnimeCard anime={a} onClick={setSelectedAnime} bookmarked={bookmarks.has(a.id)} onBookmark={toggleBookmark} />
                      </div>
                    ))}
                    {filteredAnime.length === 0 && (
                      <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0", color: "#374151" }}>
                        <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: "#6b7280" }}>No results found</div>
                        <div style={{ fontSize: 13, marginTop: 6 }}>Try a different search or genre</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="sidebar">
                {/* Recent Episodes */}
                <div style={{ background: "#0d1421", borderRadius: 14, overflow: "hidden", border: "1px solid #161f30", marginBottom: 16 }}>
                  <div style={{ padding: "14px 14px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ color: "#00e5ff" }}>🕐</span> Recent Episodes
                    </h3>
                    <span style={{ fontSize: 11, color: "#e040fb", cursor: "pointer", fontWeight: 600 }}>See all</span>
                  </div>
                  {RECENT_EPISODES.map(ep => {
                    const a = ANIME_DATA.find(x => x.id === ep.animeId);
                    return (
                      <EpisodeCard
                        key={ep.id}
                        ep={{ ...ep, img: ep.img }}
                        anime={a}
                        onWatch={(anime, epNum) => handleWatch(anime, epNum)}
                      />
                    );
                  })}
                </div>
                {/* Schedule */}
                <div style={{ background: "#0d1421", borderRadius: 14, overflow: "hidden", border: "1px solid #161f30" }}>
                  <div style={{ padding: "14px 14px 12px" }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 5, marginBottom: 12 }}>
                      <span style={{ color: "#fbbf24" }}>📅</span> Airing Schedule
                    </h3>
                    {SCHEDULE.map(({ day, shows }) => (
                      <div key={day} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ width: 32, color: "#e040fb", fontSize: 11, fontWeight: 700, paddingTop: 2 }}>{day}</div>
                        <div style={{ flex: 1 }}>
                          {shows.map(s => (
                            <div key={s} style={{ color: "#6b7280", fontSize: 12, padding: "1px 0" }}>· {s}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── TRENDING ── */}
        {activeNav === "Trending" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>🔥 Trending Anime</h2>
            <p style={{ color: "#6b7280", marginBottom: 24, fontSize: 14 }}>The most watched anime this week</p>
            <div className="anime-grid">
              {[...ANIME_DATA].sort((a, b) => b.rating - a.rating).map((a, i) => (
                <div key={a.id} style={{ animation: `fadeUp 0.4s ease ${i * 0.06}s both` }}>
                  <AnimeCard anime={a} onClick={setSelectedAnime} bookmarked={bookmarks.has(a.id)} onBookmark={toggleBookmark} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SCHEDULE ── */}
        {activeNav === "Schedule" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>📅 Airing Schedule</h2>
            <p style={{ color: "#6b7280", marginBottom: 24, fontSize: 14 }}>This week's episode release times</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14 }}>
              {SCHEDULE.map(({ day, shows }) => (
                <div key={day} style={{ background: "#0d1421", borderRadius: 14, padding: 18, border: "1px solid #161f30" }}>
                  <div style={{ color: "#e040fb", fontWeight: 800, fontSize: 16, marginBottom: 12 }}>{day}</div>
                  {shows.map(s => (
                    <div key={s} style={{
                      display: "flex", alignItems: "center", gap: 7, padding: "7px 0",
                      borderBottom: "1px solid #111927", color: "#94a3b8", fontSize: 13,
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#e040fb", flexShrink: 0 }} />
                      {s}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BOOKMARKS ── */}
        {activeNav === "Bookmarks" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>🔖 My Bookmarks</h2>
            <p style={{ color: "#6b7280", marginBottom: 24, fontSize: 14 }}>Your saved anime ({bookmarks.size})</p>
            {bookmarks.size === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "#374151" }}>
                <div style={{ fontSize: 52, marginBottom: 14 }}>🔖</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 7, color: "#6b7280" }}>Nothing saved yet</div>
                <div style={{ fontSize: 14 }}>Tap the bookmark icon on any anime to save it here</div>
              </div>
            ) : (
              <div className="anime-grid">
                {ANIME_DATA.filter(a => bookmarks.has(a.id)).map((a, i) => (
                  <div key={a.id} style={{ animation: `fadeUp 0.4s ease ${i * 0.07}s both` }}>
                    <AnimeCard anime={a} onClick={setSelectedAnime} bookmarked={true} onBookmark={toggleBookmark} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #0f1a2b", padding: "36px 24px", textAlign: "center", color: "#1e2d42" }}>
        <div style={{ fontSize: 20, fontWeight: 900, background: "linear-gradient(135deg, #e040fb, #00e5ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 7 }}>
          AniStream
        </div>
        <div style={{ fontSize: 12 }}>© 2026 AniStream · For entertainment purposes only · Not affiliated with any studio</div>
      </footer>

      {/* MODAL */}
      {selectedAnime && (
        <AnimeModal
          anime={selectedAnime}
          onClose={() => setSelectedAnime(null)}
          bookmarked={bookmarks.has(selectedAnime.id)}
          onBookmark={toggleBookmark}
          onWatch={handleWatch}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   NAVBAR
───────────────────────────────────────────────────────────── */
function Navbar({ navLinks, activeNav, setActiveNav, searchActive, setSearchActive, searchQuery, setSearchQuery, mobileMenu, setMobileMenu }) {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: "rgba(7,11,18,0.93)", backdropFilter: "blur(20px)",
      borderBottom: "1px solid #0f1a2b",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px", height: 60, gap: 16,
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: "linear-gradient(135deg, #e040fb, #7c4dff)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 14px rgba(224,64,251,0.4)", fontSize: 17,
        }}>⚡</div>
        <span style={{ fontSize: 18, fontWeight: 900, background: "linear-gradient(135deg, #e040fb, #00e5ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          AniStream
        </span>
      </div>

      {/* Desktop Nav */}
      <div className="desktop-nav" style={{ display: "flex", gap: 2, alignItems: "center" }}>
        {navLinks.map(n => (
          <button key={n} onClick={() => setActiveNav(n)} style={{
            background: "none", border: "none", cursor: "pointer", padding: "6px 14px",
            borderRadius: 8, fontSize: 13, fontWeight: activeNav === n ? 700 : 500,
            color: activeNav === n ? "#e040fb" : "#6b7280",
            borderBottom: activeNav === n ? "2px solid #e040fb" : "2px solid transparent",
            transition: "color 0.2s",
          }}>{n}</button>
        ))}
      </div>

      {/* Search + Avatar + Hamburger */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {searchActive ? (
          <div style={{
            display: "flex", alignItems: "center", background: "#0d1421",
            borderRadius: 10, padding: "6px 12px", gap: 7, border: "1px solid #1e2d42",
          }}>
            <SearchIcon />
            <input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search anime..."
              style={{
                background: "none", border: "none", outline: "none", color: "#e2e8f0",
                fontSize: 13, width: 150,
              }}
            />
            <button onClick={() => { setSearchActive(false); setSearchQuery(""); }} style={{
              background: "none", border: "none", cursor: "pointer", color: "#374151", display: "flex",
            }}><CloseIcon size={16} /></button>
          </div>
        ) : (
          <button onClick={() => setSearchActive(true)} style={{
            background: "#0d1421", border: "1px solid #1e2d42", borderRadius: 9, color: "#6b7280",
            padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13,
          }}>
            <SearchIcon />
            <span className="search-label" style={{ fontSize: 13 }}>Search</span>
          </button>
        )}
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: "linear-gradient(135deg, #e040fb, #7c4dff)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, cursor: "pointer", fontWeight: 700, color: "#fff", flexShrink: 0,
        }}>A</div>
        <button className="hamburger" onClick={() => setMobileMenu(m => !m)} style={{
          background: "none", border: "none", color: "#6b7280", cursor: "pointer", display: "none", padding: 4,
        }}><MenuIcon /></button>
      </div>
    </nav>
  );
}

/* ─────────────────────────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────────────────────────── */
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Noto+Sans+JP:wght@400;700&display=swap');
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { overflow-x: hidden; max-width: 100%; }
      body { font-family: 'Outfit', 'Segoe UI', sans-serif; background: #070b12; }
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: #070b12; }
      ::-webkit-scrollbar-thumb { background: #1e2d42; border-radius: 3px; }
      ::-webkit-scrollbar-thumb:hover { background: #e040fb; }
      .ep-scroll-y { scrollbar-width: thin; scrollbar-color: #1e2d42 transparent; }
      @keyframes fadeUp { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
      @keyframes heroIn { from { opacity:0; transform:scale(1.04); } to { opacity:1; transform:scale(1); } }
      @keyframes modalIn { from { opacity:0; transform:translateY(16px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
      .anime-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(155px,1fr)); gap:14px; }
      .genre-scroll { display:flex; gap:7px; overflow-x:auto; padding-bottom:4px; scrollbar-width:none; }
      .genre-scroll::-webkit-scrollbar { display:none; }
      .main-layout { display:flex; gap:24px; align-items:flex-start; margin-top: 28px; }
      .sidebar { width:290px; flex-shrink:0; }
      .watch-layout { display:flex; gap:20px; padding:16px 24px 60px; max-width:1400px; margin:0 auto; }
      .watch-main { flex:1; min-width:0; }
      .watch-sidebar { width:300px; flex-shrink:0; position:sticky; top:76px; }
      @media(max-width:900px) {
        .anime-grid { grid-template-columns:repeat(auto-fill,minmax(130px,1fr)) !important; gap:10px !important; }
        .hero-content { padding:0 18px 36px !important; max-width:100% !important; }
        .hero-title { font-size:26px !important; }
        .main-layout { flex-direction:column !important; }
        .sidebar { width:100% !important; }
        .watch-layout { flex-direction:column !important; }
        .watch-sidebar { width:100% !important; position:static !important; }
        .desktop-nav { display:none !important; }
        .hamburger { display:flex !important; }
        .search-label { display:none; }
      }
    `}</style>
  );
}
