import { useEffect, useState } from "react"
import { opendota } from "../services/opendota"
import { heroImgUrl, formatDuration } from "../utils"
import { Spinner } from "../components/Loader"
import type { Screen } from "../App"

interface Props {
  matchId: number
  onBack: () => void
  onNavigate: (s: Screen) => void
}

const TEAL="#1FE3C2", GOLD="#FFB627", RED="#FF4E6A", BLUE="#4DA8FF"
const SLOT_COLORS = [TEAL, BLUE, GOLD, RED, GOLD, GOLD]
const SLOT_LABELS = ["Q","W","E","R","Т◀","Т▶"]

function buildItemImgUrl(itemName: string): string {
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/${itemName}.png`
}

export default function MatchDetailView({ matchId, onBack, onNavigate }: Props) {
  const [match, setMatch] = useState<any>(null)
  const [abilityIds, setAbilityIds] = useState<Record<string,string>>({})
  const [heroAbilities, setHeroAbilities] = useState<any>({})
  const [itemConsts, setItemConsts] = useState<any>({})
  const [heroes, setHeroes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [constsLoading, setConstsLoading] = useState(true)
  const [focusSlot, setFocusSlot] = useState<number>(0)

  useEffect(() => {
    // Match + constants in parallel — match shows first, skill order fills in when consts arrive
    opendota.match(matchId)
      .then(m => {
        setMatch(m)
        const radiant = m.players?.findIndex((p:any) => p.player_slot < 128)
        if (radiant >= 0) setFocusSlot(radiant)
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    Promise.all([
      opendota.abilityIds(),
      opendota.heroAbilities(),
      opendota.itemConstants(),
      opendota.heroStats(),
    ]).then(([aIds, hAbil, items, hs]) => {
      // /constants/abilities returns { "ability_name": { id: 5003, ... } }
      // Build reverse map: "5003" → "ability_name"
      const reversed: Record<string,string> = {}
      Object.entries(aIds ?? {}).forEach(([name, data]: any) => {
        if (data?.id != null) reversed[String(data.id)] = name
      })
      setAbilityIds(reversed)
      setHeroAbilities(hAbil ?? {})
      setItemConsts(items ?? {})
      setHeroes(hs)
    }).catch(() => {})
      .finally(() => setConstsLoading(false))
  }, [matchId])

  function heroName(id: number) {
    return heroes.find(h => h.id===id)?.localized_name ?? `#${id}`
  }
  function heroInternalName(id: number) {
    return heroes.find(h => h.id===id)?.name ?? ""
  }

  function getSkillOrder(player: any): { label:string; color:string }[] {
    // ability_upgrades_arr = flat int array; ability_upgrades = [{ability,time,level}]
    const upgrades: number[] = player.ability_upgrades_arr
      ?? (player.ability_upgrades ?? []).map((u:any) => u.ability)
    if (upgrades.length === 0 || Object.keys(abilityIds).length === 0) return []
    const slug = heroInternalName(player.hero_id).replace("npc_dota_hero_","")
    const entry = heroAbilities[slug] ?? heroAbilities[slug.replace(/-/g,"_")]
    const abilities: string[] = entry?.abilities?.slice(0,4) ?? []

    // talent slot map
    const talentMap: Record<string, number> = {}
    ;(entry?.talents ?? []).forEach((t:any, idx:number) => {
      if (t.name) talentMap[t.name] = idx % 2 === 0 ? 4 : 5
    })

    return upgrades.slice(0, 25).map(abilId => {
      const name = abilityIds[String(abilId)] ?? ""
      const slot = abilities.indexOf(name)
      if (slot >= 0 && slot < 4) return { label: SLOT_LABELS[slot], color: SLOT_COLORS[slot] }
      const ts = talentMap[name]
      if (ts !== undefined) return { label: SLOT_LABELS[ts], color: SLOT_COLORS[ts] }
      return { label: "?", color: "#4A4F60" }
    })
  }

  // Build reverse map once: id → slug (itemConsts keys are like "item_blink")
  const itemIdToSlug: Record<number,string> = {}
  Object.entries(itemConsts).forEach(([k,v]: any) => {
    if (v?.id) itemIdToSlug[v.id] = k.replace("item_","")
  })

  function getItems(player: any): string[] {
    return [0,1,2,3,4,5,6,7,8]
      .map(i => { const id = player[`item_${i}`]; return id ? (itemIdToSlug[id] ?? "") : "" })
      .filter(Boolean)
  }

  function getPurchaseLog(player: any): { time:number; item:string }[] {
    return (player.purchase_log ?? [])
      .filter((p:any) => p.key && !p.key.startsWith("recipe_"))
      .map((p:any) => ({ time: p.time, item: p.key.replace("item_","") }))
  }

  if (loading) return (
    <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <Spinner size={36} label="Загружаем матч..." />
    </div>
  )

  if (!match) return (
    <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ color:RED, fontSize:13 }}>Ошибка загрузки матча</div>
    </div>
  )

  const radiant = (match.players ?? []).filter((p:any) => p.player_slot < 128)
  const dire    = (match.players ?? []).filter((p:any) => p.player_slot >= 128)
  const focused = match.players?.[focusSlot]
  const skillOrder = focused ? getSkillOrder(focused) : []
  const items      = focused ? getItems(focused) : []
  const purchLog   = focused ? getPurchaseLog(focused) : []
  const focusedWon = focused
    ? (focused.player_slot < 128 ? match.radiant_win : !match.radiant_win)
    : false

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Header */}
      <div style={{
        background:"#13161D", borderBottom:"1px solid rgba(255,255,255,0.06)",
        padding:"14px 20px", flexShrink:0,
      }}>
        <button onClick={onBack} style={{
          background:"rgba(255,255,255,0.07)", border:"none", color:"#8B90A0",
          borderRadius:6, padding:"5px 12px", cursor:"pointer", fontSize:12, marginBottom:10,
        }}>← Назад</button>
        <div style={{ display:"flex", alignItems:"center", gap:20 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:800 }}>Матч #{matchId}</div>
            <div style={{ fontSize:11, color:"#8B90A0", marginTop:2 }}>
              {formatDuration(match.duration)} ·{" "}
              <span style={{ color: match.radiant_win ? TEAL : RED }}>
                {match.radiant_win ? "Radiant победили" : "Dire победили"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflow:"auto", padding:20, display:"flex", gap:20 }}>
        {/* Left: teams */}
        <div style={{ flex:"0 0 260px", display:"flex", flexDirection:"column", gap:12 }}>
          {/* Radiant */}
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:match.radiant_win?TEAL:"#4A4F60", letterSpacing:"0.08em", marginBottom:6 }}>
              RADIANT{match.radiant_win?" · ПОБЕДА":""}
            </div>
            {radiant.map((p:any, i:number) => {
              const slot = match.players.indexOf(p)
              return (
                <button key={i} onClick={() => setFocusSlot(slot)} style={{
                  width:"100%", background: focusSlot===slot ? "rgba(31,227,194,0.08)" : "#13161D",
                  border: focusSlot===slot ? "1px solid rgba(31,227,194,0.20)" : "1px solid rgba(255,255,255,0.05)",
                  borderRadius:8, padding:"7px 10px", cursor:"pointer",
                  display:"flex", alignItems:"center", gap:8, textAlign:"left", marginBottom:4,
                }}>
                  <div style={{ width:36,height:20,borderRadius:4,overflow:"hidden",background:"#1A1D26",flexShrink:0 }}>
                    <img src={heroImgUrl(heroInternalName(p.hero_id))} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt=""
                      onError={(e) => { (e.target as HTMLImageElement).style.display="none" }} />
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:11,fontWeight:600,color:"#E8EAF2",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                      {p.personaname ?? heroName(p.hero_id)}
                    </div>
                  </div>
                  <div style={{ fontSize:11,fontFamily:"monospace",color:"#8B90A0" }}>
                    {p.kills}/{p.deaths}/{p.assists}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Dire */}
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:!match.radiant_win?RED:"#4A4F60", letterSpacing:"0.08em", marginBottom:6 }}>
              DIRE{!match.radiant_win?" · ПОБЕДА":""}
            </div>
            {dire.map((p:any, i:number) => {
              const slot = match.players.indexOf(p)
              return (
                <button key={i} onClick={() => setFocusSlot(slot)} style={{
                  width:"100%", background: focusSlot===slot ? "rgba(31,227,194,0.08)" : "#13161D",
                  border: focusSlot===slot ? "1px solid rgba(31,227,194,0.20)" : "1px solid rgba(255,255,255,0.05)",
                  borderRadius:8, padding:"7px 10px", cursor:"pointer",
                  display:"flex", alignItems:"center", gap:8, textAlign:"left", marginBottom:4,
                }}>
                  <div style={{ width:36,height:20,borderRadius:4,overflow:"hidden",background:"#1A1D26",flexShrink:0 }}>
                    <img src={heroImgUrl(heroInternalName(p.hero_id))} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt=""
                      onError={(e) => { (e.target as HTMLImageElement).style.display="none" }} />
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:11,fontWeight:600,color:"#E8EAF2",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                      {p.personaname ?? heroName(p.hero_id)}
                    </div>
                  </div>
                  <div style={{ fontSize:11,fontFamily:"monospace",color:"#8B90A0" }}>
                    {p.kills}/{p.deaths}/{p.assists}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right: focused player detail */}
        {focused && (
          <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:16 }}>
            {/* Player summary */}
            <div style={{
              background:"#13161D", border:`1px solid ${focusedWon?"rgba(31,227,194,0.18)":"rgba(255,78,106,0.14)"}`,
              borderRadius:12, padding:"14px 16px",
              display:"flex", alignItems:"center", gap:14,
            }}>
              <div style={{ width:56,height:32,borderRadius:7,overflow:"hidden",background:"#1A1D26",flexShrink:0 }}>
                <img src={heroImgUrl(heroInternalName(focused.hero_id))} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt="" />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15,fontWeight:800 }}>{heroName(focused.hero_id)}</div>
                <div style={{ fontSize:11,color:"#8B90A0",marginTop:2 }}>
                  {focused.personaname ?? ""}
                  {" · "}
                  <span style={{ color:focusedWon?TEAL:RED }}>{focusedWon?"Победа":"Поражение"}</span>
                </div>
              </div>
              <div style={{ display:"flex", gap:16, textAlign:"center" }}>
                {[
                  ["KDA",   `${focused.kills}/${focused.deaths}/${focused.assists}`],
                  ["GPM",   focused.gold_per_min],
                  ["XPM",   focused.xp_per_min],
                  ["Урон",  (focused.hero_damage??0).toLocaleString()],
                ].map(([l,v]) => (
                  <div key={l as string}>
                    <div style={{ fontSize:13,fontWeight:800,fontFamily:"monospace",color:"#E8EAF2" }}>{v}</div>
                    <div style={{ fontSize:9,color:"#4A4F60",marginTop:1 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill order */}
            <div style={{ background:"#13161D",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"12px 14px" }}>
              <div style={{ fontSize:10,fontWeight:700,color:"#4A4F60",letterSpacing:"0.09em",marginBottom:10 }}>
                ПРОКАЧКА ПО УРОВНЯМ
              </div>
              {constsLoading ? (
                <div style={{ display:"flex",alignItems:"center",gap:8,color:"#4A4F60",fontSize:12 }}>
                  <Spinner size={16} />
                  <span>Загружаем данные способностей...</span>
                </div>
              ) : skillOrder.length > 0 ? (
                <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                  {skillOrder.map((s, i) => (
                    <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                      <div style={{ fontSize:8,color:"#4A4F60",fontFamily:"monospace" }}>{i+1}</div>
                      <div style={{
                        width:26, height:20, borderRadius:4,
                        background:`${s.color}20`,border:`1px solid ${s.color}40`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:s.label.length>1?7:10, fontWeight:900, color:s.color, fontFamily:"monospace",
                      }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize:12,color:"#4A4F60" }}>
                  Нет данных по прокачке для этого матча
                  {focused && (() => {
                    const raw = focused.ability_upgrades_arr ?? focused.ability_upgrades
                    return raw?.length > 0
                      ? <span style={{ marginLeft:6,color:"#FF4E6A" }}>(ability IDs есть, ошибка маппинга)</span>
                      : <span style={{ marginLeft:6 }}>(API не вернул данные)</span>
                  })()}
                </div>
              )}
            </div>

            {/* Final items */}
            <div style={{ background:"#13161D",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"12px 14px" }}>
              <div style={{ fontSize:10,fontWeight:700,color:"#4A4F60",letterSpacing:"0.09em",marginBottom:10 }}>
                ИТОГОВЫЕ ПРЕДМЕТЫ
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {items.length > 0 ? items.map((item, i) => (
                  <div key={i} style={{
                    width:44,height:32,borderRadius:6,overflow:"hidden",background:"#1A1D26",
                    border:"1px solid rgba(255,255,255,0.07)",
                  }}>
                    <img
                      src={buildItemImgUrl(item)}
                      style={{ width:"100%",height:"100%",objectFit:"cover" }}
                      alt={item}
                      onError={(e) => {
                        const el = e.target as HTMLImageElement
                        el.style.display="none"
                        el.parentElement!.style.display="flex"
                        el.parentElement!.style.alignItems="center"
                        el.parentElement!.style.justifyContent="center"
                        el.parentElement!.innerHTML=`<span style="font-size:8px;color:#4A4F60;text-align:center;padding:2px">${item.slice(0,6)}</span>`
                      }}
                    />
                  </div>
                )) : <div style={{ fontSize:12,color:"#4A4F60" }}>—</div>}
              </div>
            </div>

            {/* Purchase log */}
            {purchLog.length > 0 && (
              <div>
                <div style={{ fontSize:10,fontWeight:700,color:"#4A4F60",letterSpacing:"0.09em",marginBottom:8 }}>
                  ИСТОРИЯ ПОКУПОК
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:4, maxHeight:180, overflow:"auto" }}>
                  {purchLog.map((p, i) => {
                    const min = Math.floor(p.time/60)
                    const sec = String(p.time%60).padStart(2,"0")
                    return (
                      <div key={i} style={{
                        background:"#1A1D26", border:"1px solid rgba(255,255,255,0.06)",
                        borderRadius:6, padding:"4px 8px",
                        display:"flex", alignItems:"center", gap:6,
                      }}>
                        <div style={{ width:28,height:20,borderRadius:3,overflow:"hidden",background:"#13161D",flexShrink:0 }}>
                          <img src={buildItemImgUrl(p.item)} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt=""
                            onError={(e) => { (e.target as HTMLImageElement).style.display="none" }} />
                        </div>
                        <span style={{ fontSize:10,fontWeight:600,color:"#E8EAF2" }}>{p.item}</span>
                        <span style={{ fontSize:9,color:"#4A4F60",fontFamily:"monospace" }}>{min}:{sec}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Navigate to player */}
            {focused.account_id && (
              <button onClick={() => onNavigate({ type:"player", player:{ account_id:focused.account_id, name:focused.personaname } })}
                style={{
                  background:"#13161D", border:"1px solid rgba(255,255,255,0.07)",
                  borderRadius:9, padding:"9px 16px", cursor:"pointer",
                  color:"#8B90A0", fontSize:12, textAlign:"left",
                }}>
                Открыть профиль игрока →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
