import { useEffect, useRef, useState } from "react"
import { opendota } from "../services/opendota"
import { heroImgUrl } from "../utils"
import { AnalyzingOverlay } from "../components/Loader"
import type { Screen } from "../App"

interface Props { onNavigate: (s: Screen) => void }

const TEAL="#1FE3C2", RED="#FF4E6A", GOLD="#FFB627", BLUE="#4DA8FF"

type Position = "Carry"|"Mid"|"Offlane"|"Pos 4"|"Pos 5"
const POSITIONS: (Position|"Все")[] = ["Все","Carry","Mid","Offlane","Pos 4","Pos 5"]

interface RecHero {
  heroId: number; name: string; internalName: string
  wr: number; items: string[]; timing: "early"|"mid"|"late"
  playstyle: string; position: string
}

interface SavedDraft {
  id: string; name: string
  allies: (number|null)[]; enemies: (number|null)[]
  recs: RecHero[]; focusTarget: any
  result?: "win"|"loss"|null
  note: string; createdAt: number
}

const STORAGE_KEY = "wtu_drafts"

function loadDrafts(): SavedDraft[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") } catch { return [] }
}
function saveDrafts(d: SavedDraft[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d))
}

const POS_OVERRIDE: Record<string,Position> = {
  "Pudge":"Pos 5","Lion":"Pos 5","Crystal Maiden":"Pos 5","Shadow Shaman":"Pos 5",
  "Warlock":"Pos 5","Ancient Apparition":"Pos 5","Lich":"Pos 5","Ogre Magi":"Pos 5",
  "Earth Spirit":"Pos 4","Tusk":"Pos 4","Clockwerk":"Pos 4","Sand King":"Pos 4",
  "Phoenix":"Pos 4","Treant Protector":"Pos 4","Undying":"Pos 4","Bane":"Pos 4",
  "Invoker":"Mid","Leshrac":"Mid","Storm Spirit":"Mid","Puck":"Mid",
  "Queen of Pain":"Mid","Templar Assassin":"Mid","Death Prophet":"Mid",
  "Anti-Mage":"Carry","Juggernaut":"Carry","Phantom Assassin":"Carry",
  "Morphling":"Carry","Terrorblade":"Carry","Spectre":"Carry","Gyrocopter":"Carry",
  "Axe":"Offlane","Tidehunter":"Offlane","Timbersaw":"Offlane","Bristleback":"Offlane",
  "Underlord":"Offlane","Dragon Knight":"Offlane","Dark Seer":"Offlane",
}
const ROLE_ITEMS: Record<Position, string[]> = {
  "Carry":   ["power_treads","battlefury","manta","butterfly","abyssal_blade"],
  "Mid":     ["bottle","phase_boots","blink","orchid","sheepstick"],
  "Offlane": ["phase_boots","blink","heart","vanguard","pipe"],
  "Pos 4":   ["arcane_boots","blink","force_staff","glimmer_cape","solar_crest"],
  "Pos 5":   ["boots","urn_of_shadows","ghost","glimmer_cape","mekansm"],
}

function detectPos(h: any): Position {
  if (POS_OVERRIDE[h.localized_name]) return POS_OVERRIDE[h.localized_name]
  const r: string[] = h.roles ?? []
  if (r.includes("Carry") && !r.includes("Support")) return "Carry"
  if (r.includes("Durable") && r.includes("Initiator")) return "Offlane"
  if (r.includes("Nuker") && r.includes("Escape")) return "Mid"
  if (r.includes("Support") && r.includes("Disabler")) return "Pos 4"
  if (r.includes("Support")) return "Pos 5"
  if (r.includes("Durable")) return "Offlane"
  return "Mid"
}
function heroTiming(roles: string[]): "early"|"mid"|"late" {
  if (roles.includes("Carry") && !roles.includes("Initiator")) return "late"
  if (roles.includes("Nuker") || roles.includes("Disabler")) return "early"
  return "mid"
}
function heroPlaystyle(h: any, pos: string): string {
  const r: string[] = h.roles ?? []
  const lines: string[] = []
  if (pos==="Carry")   lines.push(heroTiming(r)==="late" ? "Фарм до 3 предметов, избегай ранних файтов" : "Агрессивный стиль с ранних уровней")
  if (pos==="Mid")     lines.push("Контроль рун, давление на боковые лейны после 6")
  if (pos==="Offlane") lines.push("Зонируй кэрри, создавай пространство")
  if (pos==="Pos 4")   lines.push("Стэки, ротация на мид после 5 уровня")
  if (pos==="Pos 5")   lines.push("Защита кэрри, варды, смоки на ранних уровнях")
  if (r.includes("Initiator")) lines.push("Инициируй командные файты")
  if (r.includes("Escape"))    lines.push("Агрессивный стиль — используй мобильность")
  if (r.includes("Pusher"))    lines.push("Ранний пуш башен")
  return lines.slice(0,2).join(" · ")
}
function timingLabel(t: "early"|"mid"|"late") {
  return t==="early" ? {label:"Ранняя",color:TEAL} : t==="mid" ? {label:"Средняя",color:GOLD} : {label:"Поздняя",color:BLUE}
}
function buildItemImgUrl(n: string) {
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/${n}.png`
}

export default function DraftView({ onNavigate }: Props) {
  const [heroes, setHeroes] = useState<any[]>([])
  const [allies, setAllies] = useState<(number|null)[]>([null,null,null,null,null])
  const [enemies, setEnemies] = useState<(number|null)[]>([null,null,null,null,null])
  const [recs, setRecs] = useState<RecHero[]>([])
  const [focusTarget, setFocusTarget] = useState<any>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [picker, setPicker] = useState<{side:"ally"|"enemy";idx:number}|null>(null)
  const [search, setSearch] = useState("")
  const [posFilter, setPosFilter] = useState<Position|"Все">("Все")
  const [selectedRec, setSelectedRec] = useState<RecHero|null>(null)
  const [recItems, setRecItems] = useState<string[]>([])
  const [itemsLoading, setItemsLoading] = useState(false)
  const [drafts, setDrafts] = useState<SavedDraft[]>(loadDrafts)
  const [showDrafts, setShowDrafts] = useState(false)
  const [draftName, setDraftName] = useState("")
  const [savingName, setSavingName] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => { opendota.heroStats().then(setHeroes).catch(()=>{}) }, [])
  useEffect(() => { if (picker) setTimeout(() => searchRef.current?.focus(), 50) }, [picker])

  const heroData = (id: number) => heroes.find(h => h.id===id)
  const heroName = (id: number) => heroData(id)?.localized_name ?? `#${id}`
  const heroInternal = (id: number) => heroData(id)?.name ?? ""

  async function analyze() {
    const enemyIds = enemies.filter(Boolean) as number[]
    if (!enemyIds.length) return
    setAnalyzing(true); setRecs([]); setFocusTarget(null); setSelectedRec(null)
    try {
      const matchups = await Promise.all(enemyIds.map(id => opendota.heroMatchups(id)))
      const pickedIds = new Set([...allies,...enemies].filter(Boolean) as number[])

      const enemyScores = enemyIds.map((eid,i) => {
        const mu = matchups[i]
        const g = mu.reduce((s:number,m:any)=>s+m.games_played,0)
        const w = mu.reduce((s:number,m:any)=>s+m.wins,0)
        return { heroId:eid, name:heroName(eid), internalName:heroInternal(eid), wr:g>0?w/g*100:50 }
      })
      const ft = enemyScores.sort((a,b)=>b.wr-a.wr)[0]
      setFocusTarget(ft)

      const scoreMap = new Map<number,{wins:number;games:number;count:number}>()
      matchups.forEach(mu => {
        mu.forEach((m:any) => {
          if (pickedIds.has(m.hero_id)) return
          const prev = scoreMap.get(m.hero_id) ?? {wins:0,games:0,count:0}
          scoreMap.set(m.hero_id, { wins:prev.wins+(m.games_played-m.wins), games:prev.games+m.games_played, count:prev.count+1 })
        })
      })

      const needed = Math.max(1, enemyIds.length-1)
      const result: RecHero[] = []
      scoreMap.forEach((v,heroId) => {
        if (v.count<needed || v.games<100) return
        const h = heroData(heroId); if (!h) return
        const pos = detectPos(h)
        result.push({
          heroId, name:h.localized_name, internalName:h.name??'',
          wr:v.games>0?v.wins/v.games*100:50,
          items:ROLE_ITEMS[pos]??[], timing:heroTiming(h.roles??[]),
          playstyle:heroPlaystyle(h,pos), position:pos,
        })
      })
      result.sort((a,b)=>b.wr-a.wr)
      setRecs(result.slice(0,20))
    } catch(e){ console.error(e) }
    setAnalyzing(false)
  }

  async function selectRec(rec: RecHero) {
    setSelectedRec(rec); setItemsLoading(true)
    try {
      const data = await opendota.heroItemPopularity(rec.heroId)
      const allItems = [
        ...Object.entries(data.start_game_items ?? {}),
        ...Object.entries(data.early_game_items ?? {}),
        ...Object.entries(data.mid_game_items   ?? {}),
        ...Object.entries(data.late_game_items  ?? {}),
      ] as [string,any][]
      const sorted = allItems
        .filter(([n]) => !n.startsWith("recipe_") && n!=="ward_observer" && n!=="ward_sentry" && n!=="tpscroll")
        .sort((a,b) => (b[1].games ?? b[1].match_count ?? 0) - (a[1].games ?? a[1].match_count ?? 0))
        .slice(0,12).map(([n]) => n.replace("item_",""))
      setRecItems(sorted.length>0 ? sorted : rec.items)
    } catch { setRecItems(rec.items) }
    setItemsLoading(false)
  }

  function pickHero(id: number) {
    if (!picker) return
    if (picker.side==="ally") { const a=[...allies]; a[picker.idx]=id; setAllies(a) }
    else { const e=[...enemies]; e[picker.idx]=id; setEnemies(e) }
    setPicker(null); setSearch("")
  }

  function saveDraft() {
    const name = draftName.trim() || `Драфт ${new Date().toLocaleDateString("ru")}`
    const d: SavedDraft = {
      id: Date.now().toString(), name, allies, enemies,
      recs, focusTarget, result:null, note:"", createdAt:Date.now(),
    }
    const updated = [d, ...drafts].slice(0,20)
    setDrafts(updated); saveDrafts(updated)
    setSavingName(false); setDraftName("")
  }

  function loadDraft(d: SavedDraft) {
    setAllies(d.allies); setEnemies(d.enemies)
    setRecs(d.recs); setFocusTarget(d.focusTarget)
    setSelectedRec(null); setShowDrafts(false)
  }

  function setDraftResult(id: string, result: "win"|"loss") {
    const updated = drafts.map(d => d.id===id ? {...d, result} : d)
    setDrafts(updated); saveDrafts(updated)
  }

  function deleteDraft(id: string) {
    const updated = drafts.filter(d => d.id!==id)
    setDrafts(updated); saveDrafts(updated)
  }

  const filteredHeroes = heroes.filter(h => !search || h.localized_name?.toLowerCase().includes(search.toLowerCase()))
  const filteredRecs = posFilter==="Все" ? recs : recs.filter(r => r.position===posFilter)

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Header */}
      <div style={{
        background:"#13161D", borderBottom:"1px solid rgba(255,255,255,0.06)",
        padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0,
      }}>
        <div>
          <span style={{ fontSize:16,fontWeight:800 }}>Анализ драфта</span>
          <span style={{ fontSize:11,color:"#8B90A0",marginLeft:10 }}>Контрпики · Предметы · Стиль игры</span>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => setShowDrafts(!showDrafts)} style={{
            background:"#1A1D26", border:"1px solid rgba(255,255,255,0.07)",
            color:showDrafts?TEAL:"#8B90A0", borderRadius:8, padding:"6px 14px",
            cursor:"pointer", fontSize:12, fontWeight:600,
          }}>
            Сохранённые {drafts.length>0 && `(${drafts.length})`}
          </button>
          {recs.length>0 && !savingName && (
            <button onClick={()=>setSavingName(true)} style={{
              background:"rgba(31,227,194,0.10)", border:"1px solid rgba(31,227,194,0.22)",
              color:TEAL, borderRadius:8, padding:"6px 14px", cursor:"pointer", fontSize:12, fontWeight:600,
            }}>Сохранить</button>
          )}
          {savingName && (
            <div style={{ display:"flex", gap:6 }}>
              <input value={draftName} onChange={e=>setDraftName(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&saveDraft()}
                placeholder="Название драфта..."
                autoFocus
                style={{ padding:"5px 10px",background:"#1A1D26",border:"1px solid rgba(255,255,255,0.1)",
                  borderRadius:7,color:"#E8EAF2",fontSize:12,outline:"none",width:160 }} />
              <button onClick={saveDraft} style={{ background:TEAL,border:"none",color:"#0D0F14",borderRadius:7,padding:"5px 12px",cursor:"pointer",fontSize:12,fontWeight:700 }}>OK</button>
              <button onClick={()=>setSavingName(false)} style={{ background:"transparent",border:"none",color:"#8B90A0",cursor:"pointer",fontSize:13 }}>✕</button>
            </div>
          )}
        </div>
      </div>

      {/* Saved drafts panel */}
      {showDrafts && (
        <div style={{
          background:"#13161D", borderBottom:"1px solid rgba(255,255,255,0.06)",
          padding:"12px 20px", display:"flex", gap:10, flexWrap:"wrap", flexShrink:0, overflowX:"auto",
        }}>
          {drafts.length===0 && <div style={{ fontSize:12,color:"#4A4F60" }}>Нет сохранённых драфтов</div>}
          {drafts.map(d => (
            <div key={d.id} style={{
              background:"#1A1D26", border:"1px solid rgba(255,255,255,0.07)",
              borderRadius:10, padding:"8px 12px", minWidth:180,
              display:"flex", flexDirection:"column", gap:6,
            }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
                <span style={{ fontSize:12,fontWeight:700,color:"#E8EAF2" }}>{d.name}</span>
                <button onClick={()=>deleteDraft(d.id)} style={{ background:"transparent",border:"none",color:"#4A4F60",cursor:"pointer",fontSize:11 }}>✕</button>
              </div>
              <div style={{ display:"flex", gap:3 }}>
                {d.enemies.filter(Boolean).map((id,i) => (
                  <div key={i} style={{ width:28,height:16,borderRadius:3,overflow:"hidden",background:"#0D0F14" }}>
                    {id && heroInternal(id as number) && <img src={heroImgUrl(heroInternal(id as number))} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt="" />}
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:5 }}>
                <button onClick={()=>loadDraft(d)} style={{ flex:1,background:"rgba(31,227,194,0.08)",border:"1px solid rgba(31,227,194,0.18)",color:TEAL,borderRadius:6,padding:"4px 0",cursor:"pointer",fontSize:11,fontWeight:600 }}>Загрузить</button>
                <button onClick={()=>setDraftResult(d.id,"win")} style={{ padding:"4px 8px",borderRadius:6,border:"none",cursor:"pointer",background:d.result==="win"?"rgba(31,227,194,0.15)":"#13161D",color:d.result==="win"?TEAL:"#4A4F60",fontSize:11,fontWeight:700 }}>В</button>
                <button onClick={()=>setDraftResult(d.id,"loss")} style={{ padding:"4px 8px",borderRadius:6,border:"none",cursor:"pointer",background:d.result==="loss"?"rgba(255,78,106,0.15)":"#13161D",color:d.result==="loss"?RED:"#4A4F60",fontSize:11,fontWeight:700 }}>П</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main content */}
      <div style={{ flex:1, overflow:"hidden", display:"flex", padding:20, gap:20 }}>
        {/* Left: board */}
        <div style={{ flex:"0 0 260px", display:"flex", flexDirection:"column", gap:12, overflow:"auto" }}>
          <div>
            <div style={{ fontSize:10,fontWeight:700,color:"#4A4F60",letterSpacing:"0.09em",marginBottom:7 }}>МОЯ КОМАНДА</div>
            <div style={{ display:"flex", gap:5 }}>
              {allies.map((id,i) => (
                <button key={i} onClick={()=>setPicker({side:"ally",idx:i})} style={{
                  width:46,height:46,borderRadius:8,cursor:"pointer",flexShrink:0,
                  background:id?"rgba(31,227,194,0.08)":"transparent",
                  border:id?"1px solid rgba(31,227,194,0.22)":"1px dashed rgba(31,227,194,0.20)",
                  overflow:"hidden",padding:0,
                  display:"flex",alignItems:"center",justifyContent:"center",
                }}>
                  {id && heroInternal(id)
                    ? <img src={heroImgUrl(heroInternal(id))} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt="" />
                    : <span style={{ fontSize:18,color:TEAL,fontWeight:200 }}>+</span>}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize:10,fontWeight:700,color:"#4A4F60",letterSpacing:"0.09em",marginBottom:7 }}>ПРОТИВНИКИ</div>
            <div style={{ display:"flex", gap:5 }}>
              {enemies.map((id,i) => (
                <button key={i} onClick={()=>setPicker({side:"enemy",idx:i})} style={{
                  width:46,height:46,borderRadius:8,cursor:"pointer",flexShrink:0,
                  background:id?"rgba(255,78,106,0.08)":"transparent",
                  border:id?"1px solid rgba(255,78,106,0.22)":"1px dashed rgba(255,78,106,0.20)",
                  overflow:"hidden",padding:0,
                  display:"flex",alignItems:"center",justifyContent:"center",
                }}>
                  {id && heroInternal(id)
                    ? <img src={heroImgUrl(heroInternal(id))} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt="" />
                    : <span style={{ fontSize:18,color:RED,fontWeight:200 }}>+</span>}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display:"flex", gap:6 }}>
            <button onClick={analyze} disabled={analyzing||!enemies.filter(Boolean).length} style={{
              flex:1,padding:"10px 0",borderRadius:10,border:"none",
              background:enemies.filter(Boolean).length?TEAL:"#1A1D26",
              color:enemies.filter(Boolean).length?"#0D0F14":"#4A4F60",
              fontWeight:700,fontSize:13,cursor:"pointer",
            }}>{analyzing?"Анализ...":"Анализировать"}</button>
            <button onClick={()=>{setAllies([null,null,null,null,null]);setEnemies([null,null,null,null,null]);setRecs([]);setSelectedRec(null);setFocusTarget(null)}} style={{
              padding:"10px 12px",borderRadius:10,border:"1px solid rgba(255,255,255,0.07)",
              background:"transparent",color:"#8B90A0",fontSize:12,cursor:"pointer",
            }}>✕</button>
          </div>

          {focusTarget && (
            <div style={{ background:"rgba(255,184,0,0.06)",border:"1px solid rgba(255,184,0,0.18)",borderRadius:10,padding:"10px 12px" }}>
              <div style={{ fontSize:9,fontWeight:700,color:GOLD,letterSpacing:"0.09em",marginBottom:7 }}>ПРИОРИТЕТ ФОКУСА</div>
              <div style={{ display:"flex",alignItems:"center",gap:9 }}>
                <div style={{ width:44,height:25,borderRadius:5,overflow:"hidden",background:"#1A1D26",flexShrink:0 }}>
                  {focusTarget.internalName && <img src={heroImgUrl(focusTarget.internalName)} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt="" />}
                </div>
                <div>
                  <div style={{ fontSize:12,fontWeight:700,color:"#E8EAF2" }}>{focusTarget.name}</div>
                  <div style={{ fontSize:9,color:"#8B90A0" }}>Самый опасный — убивай первым</div>
                </div>
              </div>
            </div>
          )}

          {recs.length>0 && (
            <>
              <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>
                {POSITIONS.map(p => (
                  <button key={p} onClick={()=>setPosFilter(p)} style={{
                    padding:"3px 9px",borderRadius:20,border:"none",cursor:"pointer",fontSize:10,fontWeight:600,
                    background:posFilter===p?TEAL:"#1A1D26",color:posFilter===p?"#0D0F14":"#8B90A0",
                  }}>{p}</button>
                ))}
              </div>
              <div style={{ flex:1,overflow:"auto",display:"flex",flexDirection:"column",gap:3 }}>
                {filteredRecs.map((r,i) => {
                  const tl = timingLabel(r.timing)
                  return (
                    <button key={r.heroId} onClick={()=>selectRec(r)} style={{
                      background:selectedRec?.heroId===r.heroId?"rgba(31,227,194,0.07)":"#13161D",
                      border:selectedRec?.heroId===r.heroId?"1px solid rgba(31,227,194,0.22)":"1px solid rgba(255,255,255,0.06)",
                      borderRadius:8,padding:"7px 9px",cursor:"pointer",
                      display:"flex",alignItems:"center",gap:7,textAlign:"left",
                    }}>
                      <span style={{ fontSize:9,color:"#4A4F60",width:14,textAlign:"right" }}>{i+1}</span>
                      <div style={{ width:36,height:20,borderRadius:4,overflow:"hidden",background:"#1A1D26",flexShrink:0 }}>
                        {r.internalName && <img src={heroImgUrl(r.internalName)} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt="" />}
                      </div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:11,fontWeight:600,color:"#E8EAF2",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.name}</div>
                        <div style={{ fontSize:9,color:"#4A4F60" }}>{r.position}</div>
                      </div>
                      <div style={{ textAlign:"right",flexShrink:0 }}>
                        <div style={{ fontSize:12,fontWeight:800,fontFamily:"monospace",color:TEAL }}>{r.wr.toFixed(1)}%</div>
                        <div style={{ fontSize:8,color:tl.color }}>{tl.label}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {!recs.length && analyzing && (
            <div style={{ flex:1 }}><AnalyzingOverlay /></div>
          )}
          {!recs.length && !analyzing && (
            <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:"#4A4F60",fontSize:12 }}>
              Добавь противников →
            </div>
          )}
        </div>

        {/* Right: selected rec detail */}
        {selectedRec && (
          <div style={{ flex:1,minWidth:0,overflow:"auto",display:"flex",flexDirection:"column",gap:12 }}>
            <div style={{ background:"#13161D",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"14px 16px",display:"flex",alignItems:"center",gap:14 }}>
              <div style={{ width:64,height:36,borderRadius:8,overflow:"hidden",background:"#1A1D26",flexShrink:0 }}>
                {selectedRec.internalName && <img src={heroImgUrl(selectedRec.internalName)} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt="" />}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:18,fontWeight:800 }}>{selectedRec.name}</div>
                <div style={{ fontSize:11,color:"#8B90A0",marginTop:2 }}>{selectedRec.position}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:24,fontWeight:900,fontFamily:"monospace",color:TEAL }}>{selectedRec.wr.toFixed(1)}%</div>
                <div style={{ fontSize:10,color:"#4A4F60" }}>против этого драфта</div>
              </div>
            </div>

            <div style={{ background:"#13161D",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"14px 16px" }}>
              <div style={{ fontSize:10,fontWeight:700,color:"#4A4F60",letterSpacing:"0.09em",marginBottom:10 }}>ТАЙМИНГИ</div>
              <div style={{ display:"flex",gap:8 }}>
                {(["early","mid","late"] as const).map(t => {
                  const tl = timingLabel(t); const active = selectedRec.timing===t
                  return (
                    <div key={t} style={{ flex:1,padding:"10px 8px",borderRadius:9,textAlign:"center",
                      background:active?`${tl.color}12`:"#1A1D26",border:active?`1px solid ${tl.color}30`:"1px solid transparent" }}>
                      <div style={{ fontSize:12,fontWeight:active?800:400,color:active?tl.color:"#4A4F60" }}>{tl.label}</div>
                      <div style={{ fontSize:9,color:"#4A4F60",marginTop:3 }}>{t==="early"?"0–15 мин":t==="mid"?"15–30 мин":"30+ мин"}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ background:"#13161D",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"14px 16px" }}>
              <div style={{ fontSize:10,fontWeight:700,color:"#4A4F60",letterSpacing:"0.09em",marginBottom:8 }}>СТИЛЬ ИГРЫ</div>
              <div style={{ fontSize:13,color:"#E8EAF2",lineHeight:1.6 }}>{selectedRec.playstyle}</div>
            </div>

            <div style={{ background:"#13161D",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"14px 16px" }}>
              <div style={{ fontSize:10,fontWeight:700,color:"#4A4F60",letterSpacing:"0.09em",marginBottom:10 }}>
                ПОПУЛЯРНЫЕ ПРЕДМЕТЫ
                {itemsLoading && <span style={{ color:"#4A4F60",fontWeight:400,marginLeft:8,fontSize:9 }}>загрузка...</span>}
              </div>
              <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                {(itemsLoading ? selectedRec.items : recItems.length>0 ? recItems : selectedRec.items).map((item,i) => (
                  <div key={i} style={{ display:"flex",alignItems:"center",gap:6,background:"#1A1D26",border:"1px solid rgba(255,255,255,0.06)",borderRadius:7,padding:"4px 8px" }}>
                    <div style={{ width:28,height:20,borderRadius:3,overflow:"hidden",background:"#0D0F14",flexShrink:0 }}>
                      <img src={buildItemImgUrl(item)} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt=""
                        onError={(e)=>{(e.target as HTMLImageElement).style.display="none"}} />
                    </div>
                    <span style={{ fontSize:10,fontWeight:600,color:"#E8EAF2" }}>{item.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={()=>{ const h=heroes.find(x=>x.id===selectedRec.heroId); if(h) onNavigate({type:"hero",hero:h,heroStats:heroes}) }}
              style={{ background:"#13161D",border:"1px solid rgba(255,255,255,0.07)",borderRadius:9,padding:"10px 16px",cursor:"pointer",color:"#8B90A0",fontSize:12,textAlign:"left" }}>
              Открыть страницу героя →
            </button>
          </div>
        )}
      </div>

      {/* Hero picker OVERLAY */}
      {picker && (
        <div style={{
          position:"fixed",inset:0,zIndex:200,
          background:"rgba(13,15,20,0.92)",backdropFilter:"blur(8px)",
          display:"flex",flexDirection:"column",padding:24,
        }}>
          <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:14 }}>
            <div style={{ flex:1,fontSize:15,fontWeight:700 }}>
              {picker.side==="ally"?"Союзник":"Противник"} #{picker.idx+1}
            </div>
            <input
              ref={searchRef}
              value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Поиск героя..."
              style={{ flex:"0 0 260px",padding:"8px 14px",background:"#13161D",border:"1px solid rgba(255,255,255,0.12)",borderRadius:9,color:"#E8EAF2",fontSize:13,outline:"none" }}
            />
            <button onClick={()=>{setPicker(null);setSearch("")}} style={{ background:"rgba(255,255,255,0.07)",border:"none",color:"#8B90A0",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:13 }}>
              Закрыть
            </button>
          </div>
          <div style={{ flex:1,overflow:"auto",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(80px,1fr))",gap:6,alignContent:"start" }}>
            {filteredHeroes.map(h => (
              <button key={h.id} onClick={()=>pickHero(h.id)} style={{
                background:"#13161D",border:"1px solid rgba(255,255,255,0.07)",
                borderRadius:8,padding:0,cursor:"pointer",overflow:"hidden",
                display:"flex",flexDirection:"column",
              }}>
                <div style={{ height:46,background:"#1A1D26",width:"100%" }}>
                  {h.name && <img src={heroImgUrl(h.name)} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt="" />}
                </div>
                <div style={{ padding:"3px 4px",fontSize:8,fontWeight:600,color:"#8B90A0",textAlign:"center",lineHeight:1.2 }}>
                  {h.localized_name}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
