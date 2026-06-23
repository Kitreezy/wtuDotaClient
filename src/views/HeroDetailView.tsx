import { useEffect, useState } from "react"
import { opendota } from "../services/opendota"
import { heroImgUrl, formatDuration, wrColor } from "../utils"
import type { Screen } from "../App"

interface Props {
  hero: any
  heroStats: any[]
  onBack: () => void
  onNavigate: (s: Screen) => void
}

type Tab = "overview" | "matches" | "players"

const TEAL = "#1FE3C2"

function bracketWins(h:any)  { return [1,2,3,4,5,6,7,8].reduce((s,b)=>s+(h[`${b}_win`]??0),0) }
function bracketPicks(h:any) { return [1,2,3,4,5,6,7,8].reduce((s,b)=>s+(h[`${b}_pick`]??0),0) }

export default function HeroDetailView({ hero, heroStats, onBack, onNavigate }: Props) {
  const [tab, setTab] = useState<Tab>("overview")
  const [matches, setMatches] = useState<any[]>([])
  const [players, setPlayers] = useState<any[]>([])
  const [matchups, setMatchups] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const picks = bracketPicks(hero)
  const wins  = bracketWins(hero)
  const wr    = picks>0 ? wins/picks*100 : 50

  useEffect(() => {
    setLoading(true)
    Promise.all([
      opendota.heroMatches(hero.id),
      opendota.heroMatchups(hero.id),
    ]).then(([m, mu]) => {
      setMatches(m)
      setMatchups(mu)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [hero.id])

  useEffect(() => {
    if (tab === "players" && players.length === 0) {
      opendota.proPlayers().then(pp => {
        // filter to players who have played this hero (we use matches data)
        const ids = new Set(matches.map((m:any) => m.account_id).filter(Boolean))
        setPlayers(pp.filter((p:any) => ids.has(p.account_id)).slice(0, 20))
      }).catch(() => {})
    }
  }, [tab])

  const counters = matchups
    .filter(m => m.games_played >= 100)
    .sort((a,b) => (a.wins/a.games_played) - (b.wins/b.games_played))
    .slice(0, 8)
    .map(m => {
      const h = heroStats.find(x => x.id===m.hero_id)
      return { ...m, localized_name: h?.localized_name ?? `#${m.hero_id}`, name: h?.name }
    })

  const synergies = matchups
    .filter(m => m.games_played >= 100)
    .sort((a,b) => (b.wins/b.games_played) - (a.wins/a.games_played))
    .slice(0, 8)
    .map(m => {
      const h = heroStats.find(x => x.id===m.hero_id)
      return { ...m, localized_name: h?.localized_name ?? `#${m.hero_id}`, name: h?.name }
    })

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Hero banner */}
      <div style={{
        position:"relative", height:140, flexShrink:0,
        background:"#13161D", borderBottom:"1px solid rgba(255,255,255,0.06)", overflow:"hidden",
      }}>
        {hero.name && (
          <img src={heroImgUrl(hero.name)}
            style={{ position:"absolute", right:0, top:0, height:"100%", width:"50%", objectFit:"cover", objectPosition:"top", opacity:0.35 }}
            alt="" onError={(e) => { (e.target as HTMLImageElement).style.display="none" }} />
        )}
        <div style={{ position:"relative", padding:"16px 20px" }}>
          <button onClick={onBack} style={{
            background:"rgba(255,255,255,0.07)", border:"none", color:"#8B90A0",
            borderRadius:6, padding:"5px 12px", cursor:"pointer", fontSize:12, marginBottom:10,
          }}>← Назад</button>
          <div style={{ display:"flex", alignItems:"flex-end", gap:16 }}>
            <div style={{ width:64, height:36, borderRadius:7, overflow:"hidden", background:"#1A1D26", flexShrink:0 }}>
              {hero.name && <img src={heroImgUrl(hero.name)} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="" />}
            </div>
            <div>
              <div style={{ fontSize:22, fontWeight:800, color:"#E8EAF2" }}>{hero.localized_name}</div>
              <div style={{ fontSize:12, color:"#8B90A0" }}>
                {(hero.roles??[]).join(" · ")} · {hero.attack_type}
              </div>
            </div>
            <div style={{ marginLeft:"auto", textAlign:"right" }}>
              <div style={{ fontSize:28, fontWeight:900, fontFamily:"monospace", color:wrColor(wr) }}>
                {wr.toFixed(1)}%
              </div>
              <div style={{ fontSize:11, color:"#4A4F60" }}>{picks.toLocaleString()} игр</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display:"flex", gap:0,
        borderBottom:"1px solid rgba(255,255,255,0.06)",
        background:"#13161D", flexShrink:0,
      }}>
        {(["overview","matches","players"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:"10px 20px", border:"none", cursor:"pointer", fontSize:12, fontWeight:700,
            background:"transparent",
            color: tab===t ? TEAL : "#8B90A0",
            borderBottom: tab===t ? `2px solid ${TEAL}` : "2px solid transparent",
          }}>
            {t==="overview"?"Обзор":t==="matches"?"Матчи":"Игроки"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:"auto", padding:20 }}>
        {loading && tab==="overview" && (
          <div style={{ color:"#8B90A0", fontSize:13 }}>Загрузка...</div>
        )}

        {tab === "overview" && !loading && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            {/* Counters */}
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#4A4F60", letterSpacing:"0.08em", marginBottom:10 }}>
                КОНТРПИКИ (сложные матчапы)
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {counters.map(c => (
                  <button key={c.hero_id} onClick={() => {
                    const h = heroStats.find(x => x.id===c.hero_id)
                    if (h) onNavigate({ type:"hero", hero:h, heroStats })
                  }} style={{
                    background:"#13161D", border:"1px solid rgba(255,78,106,0.12)",
                    borderRadius:8, padding:"8px 12px", cursor:"pointer",
                    display:"flex", alignItems:"center", gap:10, textAlign:"left",
                  }}>
                    <div style={{ width:36, height:20, borderRadius:4, overflow:"hidden", background:"#1A1D26", flexShrink:0 }}>
                      {c.name && <img src={heroImgUrl(c.name)} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="" />}
                    </div>
                    <span style={{ flex:1, fontSize:12, fontWeight:600, color:"#E8EAF2" }}>{c.localized_name}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:"#FF4E6A", fontFamily:"monospace" }}>
                      {(c.wins/c.games_played*100).toFixed(1)}%
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Synergies */}
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#4A4F60", letterSpacing:"0.08em", marginBottom:10 }}>
                СИНЕРГИИ (хорошие матчапы)
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {synergies.map(c => (
                  <button key={c.hero_id} onClick={() => {
                    const h = heroStats.find(x => x.id===c.hero_id)
                    if (h) onNavigate({ type:"hero", hero:h, heroStats })
                  }} style={{
                    background:"#13161D", border:"1px solid rgba(31,227,194,0.12)",
                    borderRadius:8, padding:"8px 12px", cursor:"pointer",
                    display:"flex", alignItems:"center", gap:10, textAlign:"left",
                  }}>
                    <div style={{ width:36, height:20, borderRadius:4, overflow:"hidden", background:"#1A1D26", flexShrink:0 }}>
                      {c.name && <img src={heroImgUrl(c.name)} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="" />}
                    </div>
                    <span style={{ flex:1, fontSize:12, fontWeight:600, color:"#E8EAF2" }}>{c.localized_name}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:"#1FE3C2", fontFamily:"monospace" }}>
                      {(c.wins/c.games_played*100).toFixed(1)}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "matches" && (
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {loading && <div style={{ color:"#8B90A0", fontSize:13 }}>Загрузка...</div>}
            {matches.slice(0,20).map((m:any) => {
              const won = m.radiant_win === (m.player_slot < 128)
              return (
                <button key={m.match_id} onClick={() => onNavigate({ type:"match", matchId:m.match_id })} style={{
                  background:"#13161D",
                  border:`1px solid ${won?"rgba(31,227,194,0.12)":"rgba(255,78,106,0.10)"}`,
                  borderRadius:9, padding:"10px 14px", cursor:"pointer", textAlign:"left",
                  display:"flex", alignItems:"center", gap:14,
                }}>
                  <div style={{ fontSize:11, fontWeight:700, color:won?"#1FE3C2":"#FF4E6A", width:32 }}>
                    {won?"ПОБ":"ПОР"}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:"#E8EAF2" }}>
                      {m.player ? m.player.personaname : `ID ${m.account_id ?? "—"}`}
                    </div>
                    <div style={{ fontSize:11, color:"#8B90A0", marginTop:1 }}>
                      {formatDuration(m.duration)}
                    </div>
                  </div>
                  <div style={{ fontFamily:"monospace", fontSize:14, fontWeight:700 }}>
                    {m.kills}/{m.deaths}/{m.assists}
                  </div>
                  <div style={{ fontSize:11, color:"#4A4F60" }}>→</div>
                </button>
              )
            })}
          </div>
        )}

        {tab === "players" && (
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {players.length===0 && <div style={{ color:"#8B90A0", fontSize:13 }}>Нет данных по про игрокам</div>}
            {players.map(p => (
              <button key={p.account_id} onClick={() => onNavigate({ type:"player", player:p })} style={{
                background:"#13161D", border:"1px solid rgba(255,255,255,0.06)",
                borderRadius:9, padding:"10px 14px", cursor:"pointer",
                display:"flex", alignItems:"center", gap:12, textAlign:"left",
              }}>
                {p.avatar
                  ? <img src={p.avatar} style={{ width:32,height:32,borderRadius:6,flexShrink:0 }} alt="" />
                  : <div style={{ width:32,height:32,borderRadius:6,background:"#1A1D26",flexShrink:0 }} />
                }
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#E8EAF2" }}>{p.name}</div>
                  <div style={{ fontSize:11, color:"#8B90A0" }}>{p.team_name ?? "—"}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
