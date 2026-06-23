import { useEffect, useState } from "react"
import { opendota } from "../services/opendota"
import { formatDuration, wrColor, heroImgUrl } from "../utils"
import { Spinner } from "../components/Loader"
import type { Screen } from "../App"

interface Props {
  player: any
  onBack: () => void
  onNavigate: (s: Screen) => void
}

type Tab = "matches" | "heroes"

const TEAL = "#1FE3C2"

export default function PlayerDetailView({ player, onBack, onNavigate }: Props) {
  const [tab, setTab] = useState<Tab>("matches")
  const [profile, setProfile] = useState<any>(null)
  const [matches, setMatches] = useState<any[]>([])
  const [heroStats, setHeroStats] = useState<any[]>([])
  const [heroes, setHeroes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      opendota.player(player.account_id),
      opendota.playerMatches(player.account_id),
      opendota.playerHeroes(player.account_id),
      opendota.heroStats(),
    ]).then(([p, m, h, hs]) => {
      setProfile(p)
      setMatches(m)
      setHeroStats(h)
      setHeroes(hs)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [player.account_id])

  const enrichedHeroStats = heroStats
    .filter(h => h.games > 0)
    .sort((a, b) => b.games - a.games)
    .slice(0, 30)
    .map(h => {
      const meta = heroes.find(x => x.id === h.hero_id)
      return { ...h, localized_name: meta?.localized_name ?? `#${h.hero_id}`, name: meta?.name ?? "" }
    })

  const totalWin  = profile?.win ?? 0
  const totalLoss = profile?.lose ?? 0
  const totalGames = totalWin + totalLoss
  const totalWR   = totalGames > 0 ? totalWin / totalGames * 100 : 0

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Header */}
      <div style={{
        background:"#13161D", borderBottom:"1px solid rgba(255,255,255,0.06)",
        padding:"14px 20px", flexShrink:0,
      }}>
        <button onClick={onBack} style={{
          background:"rgba(255,255,255,0.07)", border:"none", color:"#8B90A0",
          borderRadius:6, padding:"5px 12px", cursor:"pointer", fontSize:12, marginBottom:12,
        }}>← Назад</button>

        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          {(profile?.profile?.avatarfull || player.avatar)
            ? <img src={profile?.profile?.avatarfull ?? player.avatar}
                style={{ width:50,height:50,borderRadius:10,flexShrink:0 }} alt="" />
            : <div style={{ width:50,height:50,borderRadius:10,background:"#1A1D26",flexShrink:0 }} />
          }
          <div style={{ flex:1 }}>
            <div style={{ fontSize:18, fontWeight:800 }}>
              {profile?.profile?.personaname ?? player.name}
            </div>
            <div style={{ fontSize:11, color:"#8B90A0", marginTop:2 }}>
              {player.team_name ?? ""}
              {profile?.mmr_estimate?.estimate ? `  ·  MMR ${profile.mmr_estimate.estimate}` : ""}
            </div>
          </div>
          {totalGames > 0 && (
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:22, fontWeight:900, fontFamily:"monospace", color:wrColor(totalWR) }}>
                {totalWR.toFixed(1)}%
              </div>
              <div style={{ fontSize:11, color:"#4A4F60" }}>
                {totalWin}В / {totalLoss}П · {totalGames} игр
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display:"flex", background:"#13161D",
        borderBottom:"1px solid rgba(255,255,255,0.06)", flexShrink:0,
      }}>
        {(["matches","heroes"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:"10px 20px", border:"none", cursor:"pointer", fontSize:12, fontWeight:700,
            background:"transparent",
            color: tab===t ? TEAL : "#8B90A0",
            borderBottom: tab===t ? `2px solid ${TEAL}` : "2px solid transparent",
          }}>
            {t==="matches" ? `Матчи (${matches.length})` : `Герои (${enrichedHeroStats.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:"auto", padding:20 }}>
        {loading && <div style={{ display:"flex",justifyContent:"center",paddingTop:60 }}><Spinner label="Загружаем профиль..." /></div>}

        {!loading && tab === "matches" && (
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            {matches.slice(0,20).map((m:any) => {
              const won = (m.player_slot<128 && m.radiant_win) || (m.player_slot>=128 && !m.radiant_win)
              const heroMeta = heroes.find(h => h.id===m.hero_id)
              return (
                <button key={m.match_id}
                  onClick={() => onNavigate({ type:"match", matchId:m.match_id })}
                  style={{
                    background:"#13161D",
                    border:`1px solid ${won?"rgba(31,227,194,0.10)":"rgba(255,78,106,0.08)"}`,
                    borderRadius:9, padding:"9px 14px", cursor:"pointer",
                    display:"flex", alignItems:"center", gap:12, textAlign:"left",
                  }}>
                  <div style={{ fontSize:10,fontWeight:700,color:won?"#1FE3C2":"#FF4E6A",width:30,flexShrink:0 }}>
                    {won?"ПОБ":"ПОР"}
                  </div>
                  <div style={{ width:44,height:25,borderRadius:5,overflow:"hidden",background:"#1A1D26",flexShrink:0 }}>
                    {heroMeta?.name && <img src={heroImgUrl(heroMeta.name)} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt="" />}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12,fontWeight:600 }}>{heroMeta?.localized_name ?? `#${m.hero_id}`}</div>
                    <div style={{ fontSize:10,color:"#8B90A0",marginTop:1 }}>{formatDuration(m.duration)}</div>
                  </div>
                  <div style={{ fontFamily:"monospace",fontSize:13,fontWeight:700 }}>
                    {m.kills}/{m.deaths}/{m.assists}
                  </div>
                  <div style={{ fontSize:11,color:"#4A4F60" }}>→</div>
                </button>
              )
            })}
          </div>
        )}

        {!loading && tab === "heroes" && (
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            {enrichedHeroStats.map(h => {
              const wr = h.games>0 ? h.win/h.games*100 : 50
              return (
                <button key={h.hero_id}
                  onClick={() => {
                    const meta = heroes.find(x => x.id===h.hero_id)
                    if (meta) onNavigate({ type:"hero", hero:meta, heroStats:heroes })
                  }}
                  style={{
                    background:"#13161D", border:"1px solid rgba(255,255,255,0.06)",
                    borderRadius:9, padding:"9px 14px", cursor:"pointer", textAlign:"left",
                    display:"flex", alignItems:"center", gap:12,
                  }}>
                  <div style={{ width:44,height:25,borderRadius:5,overflow:"hidden",background:"#1A1D26",flexShrink:0 }}>
                    {h.name && <img src={heroImgUrl(h.name)} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt="" />}
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                      {h.localized_name}
                    </div>
                    <div style={{ fontSize:10,color:"#8B90A0",marginTop:1 }}>
                      {h.games} игр · {h.win}В {h.games-h.win}П
                    </div>
                  </div>
                  <div style={{ textAlign:"right",flexShrink:0 }}>
                    <div style={{ fontSize:14,fontWeight:800,fontFamily:"monospace",color:wrColor(wr) }}>
                      {wr.toFixed(1)}%
                    </div>
                  </div>
                  <div style={{ fontSize:11,color:"#4A4F60" }}>→</div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
