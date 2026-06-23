import { useState } from "react"
import FeedView from "./views/FeedView"
import TierListView from "./views/TierListView"
import SearchView from "./views/SearchView"
import DraftView from "./views/DraftView"
import ProfileView from "./views/ProfileView"
import HeroDetailView from "./views/HeroDetailView"
import PlayerDetailView from "./views/PlayerDetailView"
import MatchDetailView from "./views/MatchDetailView"
import MetaView from "./views/MetaView"

const TEAL = "#1FE3C2"

type Tab = "feed" | "tierlist" | "search" | "draft" | "meta" | "profile"

export type Screen =
  | { type: "hero";   hero: any; heroStats: any[] }
  | { type: "player"; player: any }
  | { type: "match";  matchId: number }

const NAV: { id: Tab; label: string }[] = [
  { id: "feed",     label: "Тренды"   },
  { id: "tierlist", label: "Тир-лист" },
  { id: "search",   label: "Поиск"    },
  { id: "draft",    label: "Анализ"   },
  { id: "meta",     label: "Мета"     },
  { id: "profile",  label: "Профиль"  },
]

export default function App() {
  const [tab, setTab] = useState<Tab>("feed")
  const [stack, setStack] = useState<Screen[]>([])

  const push = (s: Screen) => setStack(p => [...p, s])
  const pop  = () => setStack(p => p.slice(0, -1))
  const top  = stack[stack.length - 1]

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:"#0D0F14" }}>
      <aside style={{
        width:176, flexShrink:0,
        background:"#13161D",
        borderRight:"1px solid rgba(255,255,255,0.06)",
        display:"flex", flexDirection:"column",
        padding:"16px 10px", gap:2,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 10px", marginBottom:18 }}>
          <div style={{
            width:26, height:26, borderRadius:6,
            background:"rgba(31,227,194,0.12)", border:"1px solid rgba(31,227,194,0.20)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:11, fontWeight:900, color:TEAL,
          }}>W</div>
          <span style={{ fontWeight:800, fontSize:14, letterSpacing:"0.03em" }}>
            WTU <span style={{ color:TEAL }}>Dota</span>
          </span>
        </div>

        {NAV.map(n => (
          <button key={n.id} onClick={() => { setTab(n.id); setStack([]) }} style={{
            display:"flex", alignItems:"center",
            padding:"9px 12px", borderRadius:8, border:"none", cursor:"pointer",
            background: tab===n.id && stack.length===0 ? "rgba(31,227,194,0.09)" : "transparent",
            color: tab===n.id && stack.length===0 ? TEAL : "#8B90A0",
            fontWeight: tab===n.id && stack.length===0 ? 700 : 400,
            fontSize:13, textAlign:"left",
          }}>
            {n.label}
          </button>
        ))}
      </aside>

      <main style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
        {top?.type === "hero"   && <HeroDetailView   hero={top.hero} heroStats={top.heroStats} onBack={pop} onNavigate={push} />}
        {top?.type === "player" && <PlayerDetailView player={top.player} onBack={pop} onNavigate={push} />}
        {top?.type === "match"  && <MatchDetailView  matchId={top.matchId} onBack={pop} onNavigate={push} />}
        {!top && tab === "feed"     && <FeedView     onNavigate={push} />}
        {!top && tab === "tierlist" && <TierListView onNavigate={push} />}
        {!top && tab === "search"   && <SearchView   onNavigate={push} />}
        {!top && tab === "draft"    && <DraftView    onNavigate={push} />}
        {!top && tab === "meta"     && <MetaView />}
        {!top && tab === "profile"  && <ProfileView  onNavigate={push} />}
      </main>
    </div>
  )
}
