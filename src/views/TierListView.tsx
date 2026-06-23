import { useEffect, useState } from "react"
import { opendota } from "../services/opendota"
import { heroImgUrl } from "../utils"
import { SkeletonRow } from "../components/Loader"
import type { Screen } from "../App"

interface Props { onNavigate: (s: Screen) => void }

const TIERS = [
  { label:"S", min:54, color:"#FFB627" },
  { label:"A", min:52, color:"#1FE3C2" },
  { label:"B", min:50, color:"#4DA8FF" },
  { label:"C", min:48, color:"#8B90A0" },
  { label:"D", min:0,  color:"#FF4E6A" },
]

// Position heuristics based on roles + known hero lists
// Some heroes need explicit position override (roles alone aren't enough)
const POS_OVERRIDE: Record<string, string> = {
  "Pudge":"Pos 5", "Lion":"Pos 5", "Witch Doctor":"Pos 5",
  "Crystal Maiden":"Pos 5","Shadow Shaman":"Pos 5","Warlock":"Pos 5",
  "Earthshaker":"Pos 5","Ancient Apparition":"Pos 5","Ogre Magi":"Pos 5",
  "Rubick":"Pos 5","Jakiro":"Pos 5","Lich":"Pos 5",
  "Earth Spirit":"Pos 4","Tusk":"Pos 4","Clockwerk":"Pos 4",
  "Sand King":"Pos 4","Bane":"Pos 4","Nyx Assassin":"Pos 4",
  "Phoenix":"Pos 4","Treant Protector":"Pos 4","Undying":"Pos 4",
  "Invoker":"Mid","Leshrac":"Mid","Storm Spirit":"Mid","Puck":"Mid",
  "Queen of Pain":"Mid","Templar Assassin":"Mid","Tinker":"Mid",
  "Death Prophet":"Mid","Viper":"Mid","Pugna":"Mid",
  "Anti-Mage":"Carry","Juggernaut":"Carry","Phantom Assassin":"Carry",
  "Morphling":"Carry","Terrorblade":"Carry","Spectre":"Carry",
  "Gyrocopter":"Carry","Drow Ranger":"Carry","Slark":"Carry",
  "Axe":"Offlane","Tidehunter":"Offlane","Timbersaw":"Offlane",
  "Bristleback":"Offlane","Night Stalker":"Offlane","Underlord":"Offlane",
  "Beastmaster":"Offlane","Dragon Knight":"Offlane","Dark Seer":"Offlane",
}

function detectPosition(hero: any): string {
  if (POS_OVERRIDE[hero.localized_name]) return POS_OVERRIDE[hero.localized_name]
  const roles: string[] = hero.roles ?? []
  if (roles.includes("Carry") && !roles.includes("Support")) return "Carry"
  if (roles.includes("Durable") && roles.includes("Initiator")) return "Offlane"
  if (roles.includes("Nuker") && roles.includes("Escape")) return "Mid"
  if (roles.includes("Support") && roles.includes("Disabler")) return "Pos 4"
  if (roles.includes("Support")) return "Pos 5"
  if (roles.includes("Durable")) return "Offlane"
  if (roles.includes("Carry")) return "Carry"
  return "Mid"
}

function bracketWins(h:any)  { return [1,2,3,4,5,6,7,8].reduce((s,b)=>s+(h[`${b}_win`]??0),0) }
function bracketPicks(h:any) { return [1,2,3,4,5,6,7,8].reduce((s,b)=>s+(h[`${b}_pick`]??0),0) }

const POSITIONS = ["Все","Carry","Mid","Offlane","Pos 4","Pos 5"]

export default function TierListView({ onNavigate }: Props) {
  const [heroes, setHeroes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pos, setPos] = useState("Все")

  useEffect(() => {
    opendota.heroStats()
      .then(d => { setHeroes(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const processed = heroes
    .map(h => {
      const picks = bracketPicks(h), wins = bracketWins(h)
      const wr = picks > 0 ? wins / picks * 100 : 50
      const tier = TIERS.find(t => wr >= t.min) ?? TIERS[4]
      const position = detectPosition(h)
      return { ...h, _wr: wr, _picks: picks, tier, position }
    })
    .filter(h => h._picks >= 50)
    .filter(h => pos === "Все" || h.position === pos)
    .sort((a,b) => b._wr - a._wr)

  const byTier = TIERS.map(t => ({ ...t, heroes: processed.filter(h => h.tier.label === t.label) }))

  return (
    <div style={{ height:"100%", overflow:"auto", padding:"20px 24px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18, flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ margin:0, fontSize:18, fontWeight:800 }}>Тир-лист</h1>
          <p style={{ margin:0, fontSize:11, color:"#8B90A0", marginTop:2 }}>Divine + Immortal · по позициям</p>
        </div>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {POSITIONS.map(p => (
            <button key={p} onClick={() => setPos(p)} style={{
              padding:"4px 12px", borderRadius:20, border:"none", cursor:"pointer", fontSize:11, fontWeight:600,
              background: pos===p ? "#1FE3C2" : "#1A1D26",
              color: pos===p ? "#0D0F14" : "#8B90A0",
            }}>{p}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {TIERS.map(t => (
            <div key={t.label}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <div style={{ width:32,height:32,borderRadius:7,background:"#13161D" }} />
                <div style={{ width:80,height:14,borderRadius:4,background:"#13161D" }} />
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {Array(6).fill(0).map((_,i) => (
                  <SkeletonRow key={i} height={48} radius={9} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          {byTier.filter(t => t.heroes.length > 0).map(t => (
            <div key={t.label}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <div style={{
                  width:32, height:32, borderRadius:7,
                  background:`${t.color}18`, border:`1px solid ${t.color}28`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:14, fontWeight:900, color:t.color, fontFamily:"monospace",
                }}>{t.label}</div>
                <span style={{ fontSize:11, color:"#4A4F60" }}>
                  {t.label==="S"?"54%+":t.label==="A"?"52–54%":t.label==="B"?"50–52%":t.label==="C"?"48–50%":"<48%"}
                  {" · "}{t.heroes.length}
                </span>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {t.heroes.map(h => (
                  <button key={h.id} onClick={() => onNavigate({ type:"hero", hero:h, heroStats:heroes })}
                    style={{
                      background:"#13161D", border:"1px solid rgba(255,255,255,0.06)",
                      borderRadius:9, padding:"7px 10px", cursor:"pointer",
                      display:"flex", alignItems:"center", gap:8,
                    }}>
                    <div style={{ width:38, height:22, borderRadius:4, overflow:"hidden", background:"#1A1D26", flexShrink:0 }}>
                      {h.name && <img src={heroImgUrl(h.name)} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt=""
                        onError={(e) => { (e.target as HTMLImageElement).style.display="none" }} />}
                    </div>
                    <div style={{ textAlign:"left" }}>
                      <div style={{ fontSize:11, fontWeight:600, color:"#E8EAF2" }}>{h.localized_name}</div>
                      <div style={{ display:"flex", gap:5, alignItems:"center", marginTop:1 }}>
                        <span style={{ fontSize:10, fontWeight:700, color:t.color, fontFamily:"monospace" }}>{h._wr.toFixed(1)}%</span>
                        {pos==="Все" && <span style={{ fontSize:9, color:"#4A4F60" }}>{h.position}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {byTier.every(t => t.heroes.length === 0) && (
            <div style={{ color:"#4A4F60", fontSize:13 }}>Нет героев для этой позиции</div>
          )}
        </div>
      )}
    </div>
  )
}
