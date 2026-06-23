import { useState } from "react"
import { GENERAL_TIMINGS, POSITIONS, META_HEROES, CHECKLIST } from "../data/meta"

const TEAL="#1FE3C2", GOLD="#FFB627"

type Section = "general" | "positions" | "heroes" | "checklist"

const SECTIONS: { id: Section; label: string }[] = [
  { id:"general",   label:"Общие принципы" },
  { id:"positions", label:"По позициям"    },
  { id:"heroes",    label:"Мета герои"     },
  { id:"checklist", label:"Чеклист"        },
]

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background:"#13161D", border:"1px solid rgba(255,255,255,0.06)",
      borderRadius:12, padding:"16px 18px",
    }}>{children}</div>
  )
}

function Tag({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      fontSize:10, fontWeight:700, padding:"2px 9px", borderRadius:10,
      background:`${color}18`, color, border:`1px solid ${color}28`,
    }}>{text}</span>
  )
}

function TimingSection({ time, goal, rules, mistakes }: { time:string; goal:string[]; rules?:string[]; mistakes?:string[] }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:12, fontWeight:800, color:TEAL, marginBottom:8 }}>{time}</div>
      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
        {goal.map((g,i) => (
          <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
            <div style={{ width:4,height:4,borderRadius:"50%",background:"#4A4F60",flexShrink:0,marginTop:6 }} />
            <span style={{ fontSize:13, color:"#E8EAF2", lineHeight:1.5 }}>{g}</span>
          </div>
        ))}
        {rules?.map((r,i) => (
          <div key={i} style={{
            background:"rgba(255,184,0,0.07)", border:"1px solid rgba(255,184,0,0.15)",
            borderRadius:8, padding:"7px 12px", marginTop:4,
            fontSize:12, color:GOLD, fontStyle:"italic",
          }}>{r}</div>
        ))}
        {mistakes?.map((m,i) => (
          <div key={i} style={{
            background:"rgba(255,78,106,0.07)", border:"1px solid rgba(255,78,106,0.15)",
            borderRadius:8, padding:"7px 12px", marginTop:4,
            fontSize:12, color:"#FF4E6A",
          }}>✗ {m}</div>
        ))}
      </div>
    </div>
  )
}

export default function MetaView() {
  const [section, setSection] = useState<Section>("general")
  const [selectedPos, setSelectedPos] = useState(0)
  const [selectedHero, setSelectedHero] = useState(0)

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Header */}
      <div style={{
        background:"#13161D", borderBottom:"1px solid rgba(255,255,255,0.06)",
        padding:"12px 20px", flexShrink:0,
      }}>
        <div style={{ fontSize:16, fontWeight:800 }}>
          Мета-гайд <span style={{ fontSize:11, fontWeight:400, color:"#8B90A0", marginLeft:6 }}>Immortal · Divine</span>
        </div>
        <div style={{ display:"flex", gap:4, marginTop:10 }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)} style={{
              padding:"5px 13px", borderRadius:20, border:"none", cursor:"pointer", fontSize:11, fontWeight:600,
              background: section===s.id ? TEAL : "#1A1D26",
              color: section===s.id ? "#0D0F14" : "#8B90A0",
            }}>{s.label}</button>
          ))}
        </div>
      </div>

      <div style={{ flex:1, overflow:"auto", padding:20 }}>

        {/* General timings */}
        {section === "general" && (
          <div style={{ maxWidth:700, display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ fontSize:13, color:"#8B90A0", marginBottom:4, lineHeight:1.6 }}>
              Принципы победы в Immortal. Большинство игр определяется на 10–20 минуте.
            </div>
            {GENERAL_TIMINGS.map((t,i) => (
              <Card key={i}>
                <TimingSection {...t} />
              </Card>
            ))}
          </div>
        )}

        {/* Positions */}
        {section === "positions" && (
          <div style={{ display:"flex", gap:20, height:"100%" }}>
            <div style={{ flex:"0 0 180px", display:"flex", flexDirection:"column", gap:5 }}>
              {POSITIONS.map((p,i) => (
                <button key={i} onClick={() => setSelectedPos(i)} style={{
                  padding:"9px 12px", borderRadius:9, border:"none", cursor:"pointer", textAlign:"left",
                  background: selectedPos===i ? `${p.color}12` : "#13161D",
                  outline: selectedPos===i ? `1px solid ${p.color}30` : "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div style={{ fontSize:12, fontWeight:700, color: selectedPos===i ? p.color : "#E8EAF2" }}>{p.pos}</div>
                  <div style={{ fontSize:10, color:"#4A4F60" }}>{p.label}</div>
                </button>
              ))}
            </div>
            <div style={{ flex:1, overflow:"auto", display:"flex", flexDirection:"column", gap:12 }}>
              {(() => {
                const p = POSITIONS[selectedPos]
                return (
                  <>
                    <Card>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                        <Tag text={p.pos} color={p.color} />
                        <Tag text={p.label} color={p.color} />
                      </div>
                      <div style={{ fontSize:15, fontWeight:800, color:"#E8EAF2", marginBottom:6 }}>Задача</div>
                      <div style={{ fontSize:13, color:p.color, fontWeight:600, lineHeight:1.6 }}>{p.summary}</div>
                    </Card>
                    {p.timings.map((t,i) => (
                      <Card key={i}><TimingSection {...t} /></Card>
                    ))}
                  </>
                )
              })()}
            </div>
          </div>
        )}

        {/* Meta heroes */}
        {section === "heroes" && (
          <div style={{ display:"flex", gap:20 }}>
            <div style={{ flex:"0 0 180px", display:"flex", flexDirection:"column", gap:5 }}>
              {META_HEROES.map((h,i) => (
                <button key={i} onClick={() => setSelectedHero(i)} style={{
                  padding:"9px 12px", borderRadius:9, border:"none", cursor:"pointer", textAlign:"left",
                  background: selectedHero===i ? "rgba(31,227,194,0.09)" : "#13161D",
                  outline: selectedHero===i ? "1px solid rgba(31,227,194,0.22)" : "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div style={{ fontSize:12, fontWeight:700, color: selectedHero===i ? TEAL : "#E8EAF2" }}>{h.name}</div>
                  <div style={{ fontSize:10, color:"#4A4F60" }}>{h.pos}</div>
                </button>
              ))}
            </div>
            <div style={{ flex:1, display:"flex", flexDirection:"column", gap:12 }}>
              {(() => {
                const h = META_HEROES[selectedHero]
                const posColor = POSITIONS.find(p=>p.pos.includes(h.pos.split("/")[0].trim()))?.color ?? TEAL
                return (
                  <>
                    <Card>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                        <div style={{ fontSize:18, fontWeight:800 }}>{h.name}</div>
                        <Tag text={h.pos} color={posColor} />
                      </div>
                      <div style={{ fontSize:10, fontWeight:700, color:"#4A4F60", letterSpacing:"0.08em", marginBottom:6 }}>WIN CONDITION</div>
                      <div style={{ fontSize:14, fontWeight:700, color:TEAL, lineHeight:1.5 }}>{h.winCondition}</div>
                    </Card>
                    {h.timings.map((t,i) => (
                      <Card key={i}><TimingSection {...t} /></Card>
                    ))}
                    <Card>
                      <div style={{ fontSize:10, fontWeight:700, color:"#4A4F60", letterSpacing:"0.08em", marginBottom:8 }}>ГЛАВНАЯ ОШИБКА</div>
                      <div style={{
                        background:"rgba(255,78,106,0.07)", border:"1px solid rgba(255,78,106,0.15)",
                        borderRadius:8, padding:"10px 14px",
                        fontSize:13, color:"#FF4E6A",
                      }}>✗ {h.mistake}</div>
                    </Card>
                  </>
                )
              })()}
            </div>
          </div>
        )}

        {/* Checklist */}
        {section === "checklist" && (
          <div style={{ maxWidth:560, display:"flex", flexDirection:"column", gap:12 }}>
            {CHECKLIST.map((c,i) => (
              <Card key={i}>
                <div style={{ fontSize:13, fontWeight:800, color:TEAL, marginBottom:10 }}>{c.time}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {c.items.map((item,j) => (
                    <div key={j} style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{
                        width:18,height:18,borderRadius:5,flexShrink:0,
                        background:"rgba(31,227,194,0.10)",border:"1px solid rgba(31,227,194,0.20)",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:9,color:TEAL,fontWeight:800,
                      }}>✓</div>
                      <span style={{ fontSize:13, color:"#E8EAF2" }}>{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
