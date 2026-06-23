import { useEffect, useState } from "react"
import { opendota } from "../services/opendota"
import { heroImgUrl, wrColor } from "../utils"
import { Spinner } from "../components/Loader"
import type { Screen } from "../App"

interface Props { onNavigate: (s: Screen) => void }

const POSITIONS = ["Все","Carry","Mid","Offlane","Support","Hard Support"]
const ROLE_MAP: Record<string,string[]> = {
  "Carry":       ["Carry"],
  "Mid":         ["Nuker","Escape"],
  "Offlane":     ["Durable","Initiator"],
  "Support":     ["Support","Disabler"],
  "Hard Support":["Support"],
}

function bracketWins(h:any)  { return [1,2,3,4,5,6,7,8].reduce((s,b)=>s+(h[`${b}_win`]??0),0) }
function bracketPicks(h:any) { return [1,2,3,4,5,6,7,8].reduce((s,b)=>s+(h[`${b}_pick`]??0),0) }

export default function FeedView({ onNavigate }: Props) {
  const [heroes, setHeroes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pos, setPos] = useState("Все")

  useEffect(() => {
    opendota.heroStats().then(d => { setHeroes(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const filtered = heroes
    .filter(h => pos==="Все" || (h.roles??[]).some((r:string) => ROLE_MAP[pos]?.includes(r)))
    .map(h => {
      const picks = bracketPicks(h), wins = bracketWins(h)
      return { ...h, _picks: picks, _wins: wins, _wr: picks>0 ? wins/picks*100 : 50 }
    })
    .filter(h => h._picks >= 50)
    .sort((a,b) => b._wr - a._wr)
    .slice(0, 40)

  return (
    <div style={{ height:"100%", overflow:"auto", padding:"20px 24px" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
        <div>
          <h1 style={{ margin:0, fontSize:18, fontWeight:800 }}>Тренды меты</h1>
          <p style={{ margin:0, fontSize:11, color:"#8B90A0", marginTop:2 }}>Divine + Immortal · 14 дней</p>
        </div>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {POSITIONS.map(p => (
            <button key={p} onClick={() => setPos(p)} style={{
              padding:"4px 11px", borderRadius:20, border:"none", cursor:"pointer", fontSize:11, fontWeight:600,
              background: pos===p ? "#1FE3C2" : "#1A1D26",
              color: pos===p ? "#0D0F14" : "#8B90A0",
            }}>{p}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", paddingTop:80 }}><Spinner label="Загружаем статистику героев..." /></div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:8 }}>
          {filtered.map((h, i) => {
            const wrc = wrColor(h._wr)
            return (
              <button key={h.id} onClick={() => onNavigate({ type:"hero", hero:h, heroStats:heroes })}
                style={{
                  background:"#13161D", border:"1px solid rgba(255,255,255,0.06)",
                  borderRadius:10, padding:"10px 12px", cursor:"pointer", textAlign:"left",
                  display:"flex", alignItems:"center", gap:10,
                  transition:"border-color 0.15s",
                }}>
                <span style={{ fontSize:11, fontWeight:700, color:"#4A4F60", width:18, textAlign:"right", flexShrink:0 }}>{i+1}</span>
                <div style={{
                  width:40, height:23, borderRadius:5, overflow:"hidden", flexShrink:0,
                  background:"#1A1D26",
                }}>
                  {h.name && <img
                    src={heroImgUrl(h.name)}
                    style={{ width:"100%", height:"100%", objectFit:"cover" }}
                    alt=""
                    onError={(e) => { (e.target as HTMLImageElement).style.display="none" }}
                  />}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:"#E8EAF2", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {h.localized_name}
                  </div>
                  <div style={{ fontSize:10, color:"#8B90A0", marginTop:1 }}>
                    {(h.roles??[]).slice(0,2).join(" · ")}
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontSize:15, fontWeight:800, fontFamily:"monospace", color:wrc }}>
                    {h._wr.toFixed(1)}%
                  </div>
                  <div style={{ fontSize:10, color:"#4A4F60" }}>{h._picks.toLocaleString()}</div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
